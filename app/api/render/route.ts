import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';

export const runtime = 'nodejs';

function run(cmd: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string; code: number }>((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += String(d)));
    proc.stderr.on('data', (d) => (stderr += String(d)));
    proc.on('error', reject);
    proc.on('close', (code) => resolve({ stdout, stderr, code: code ?? 1 }));
  });
}

async function findPythonCmd(): Promise<{ cmd: string; argsPrefix: string[] }> {
  // Allow explicit override
  const override = process.env.PYTHON_PATH;
  if (override) {
    const test = await run(override, ['--version']).catch(() => null);
    if (test && test.code === 0) return { cmd: override, argsPrefix: [] };
  }

  const candidates: Array<{ cmd: string; args: string[] }> = [
    { cmd: 'python', args: ['--version'] },
    { cmd: 'python3', args: ['--version'] },
    // Windows Python launcher
    { cmd: 'py', args: ['-3', '--version'] },
  ];

  for (const c of candidates) {
    const res = await run(c.cmd, c.args).catch(() => null);
    if (res && res.code === 0) {
      // If using py, we'll prefix args with -3
      if (c.cmd === 'py') return { cmd: 'py', argsPrefix: ['-3'] };
      return { cmd: c.cmd, argsPrefix: [] };
    }
  }
  throw new Error(
    'Python 3 was not found. Install Python 3.10+ and ensure "python" (or the Windows launcher "py") is on PATH, or set PYTHON_PATH to your python.exe.'
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const conversation = {
      contact_name: body?.contactName ?? 'Contact',
      messages: (body?.messages ?? []).map((m: any) => ({
        text: m.text ?? '',
        sender: m.sent ? 'you' : 'them',
      })),
      theme: 'imessage',
    };

    // If a remote renderer is configured, use it (best for production)
    const remote = process.env.RENDERER_URL;
    if (remote) {
      const res = await fetch(remote, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        return Response.json({ ok: false, error: data.error || `Remote renderer failed (${res.status})` }, { status: 500 });
      }
      return Response.json({ ok: true, ...data }, { status: 200 });
    }

    // Prepare temp files
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-render-'));
    const inputPath = path.join(tmpDir, 'conversation.json');
    const outputId = `out-${Date.now()}.mp4`;
    const outputPath = path.join(tmpDir, outputId);
    fs.writeFileSync(inputPath, JSON.stringify(conversation, null, 2));

    // Resolve script path
    const scriptPath = path.join(process.cwd(), 'render-pipeline', 'renderer', 'render.py');
    if (!fs.existsSync(scriptPath)) {
      return Response.json({ ok: false, error: 'Renderer script not found at render-pipeline/renderer/render.py' }, { status: 500 });
    }

    // Find a working Python and execute the renderer
    const { cmd, argsPrefix } = await findPythonCmd();
    const args = [...argsPrefix, scriptPath, inputPath, outputPath];
    const exec = await run(cmd, args);
    if (exec.code !== 0) {
      return Response.json(
        {
          ok: false,
          error: `Render script failed (exit ${exec.code}). Ensure dependencies are installed. stderr: ${exec.stderr.slice(0, 2000)}`,
        },
        { status: 500 }
      );
    }

    if (!fs.existsSync(outputPath)) {
      return Response.json({ ok: false, error: 'Render completed but output file not found. Check Python dependencies (Playwright/MoviePy).' }, { status: 500 });
    }

    const url = `/api/render/download?id=${encodeURIComponent(outputPath)}`;
    return Response.json({ ok: true, url, id: outputPath });
  } catch (err: any) {
    return Response.json({ ok: false, error: err?.message || 'Render failed' }, { status: 500 });
  }
}
