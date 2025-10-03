import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // Basic safety: only allow files inside temp directory
  const tmpRoot = os.tmpdir();
  const resolved = path.resolve(id);
  if (!resolved.startsWith(path.resolve(tmpRoot))) {
    return new Response('Invalid path', { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return new Response('Not found', { status: 404 });
  }

  const stat = fs.statSync(resolved);
  const stream = fs.createReadStream(resolved);
  return new Response(stream as any, {
    headers: {
      'content-type': 'video/mp4',
      'content-length': String(stat.size),
      'content-disposition': `attachment; filename="chat-video.mp4"`
    }
  });
}
