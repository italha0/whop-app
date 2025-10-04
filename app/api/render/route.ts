import { NextRequest } from 'next/server';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import os from 'os';
import fs from 'fs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const conversation = {
      contactName: body?.contactName ?? 'Contact',
      theme: body?.theme ?? 'imessage',
      alwaysShowKeyboard: body?.alwaysShowKeyboard ?? false,
      messages: (body?.messages ?? []).map((m: any, index: number) => ({
        id: index + 1,
        text: m.text ?? '',
        sent: m.sent ?? false,
        time: m.time ?? `${Math.floor(index * 2)}:${(index * 2 * 60) % 60}`.padStart(4, '0')
      })),
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
    const outputId = `out-${Date.now()}.mp4`;
    const outputPath = path.join(tmpDir, outputId);

    console.log('🎬 Starting Remotion render...');

    // Bundle the Remotion project
    const bundleLocation = await bundle({
      entryPoint: path.resolve(process.cwd(), 'remotion/index.ts'),
      webpackOverride: (config) => config,
    });

    // Select the composition
    const compositions = await selectComposition({
      serveUrl: bundleLocation,
      id: 'MessageConversation',
      inputProps: conversation,
    });

    // Render the video
    await renderMedia({
      composition: compositions,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps: conversation,
    });

    console.log('✅ Remotion render complete');

    if (!fs.existsSync(outputPath)) {
      return Response.json({ ok: false, error: 'Render completed but output file not found.' }, { status: 500 });
    }

    const url = `/api/render/download?id=${encodeURIComponent(outputPath)}`;
    return Response.json({ ok: true, url, id: outputPath });
  } catch (err: any) {
    console.error('Remotion render failed:', err);
    return Response.json({ ok: false, error: err?.message || 'Render failed' }, { status: 500 });
  }
}
