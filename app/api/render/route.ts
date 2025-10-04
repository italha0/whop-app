import { NextRequest } from 'next/server';
import path from 'path';
import os from 'os';
import fs from 'fs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Synchronous render endpoint is disabled. Use /api/generate-video which queues a worker job.
    return Response.json({
      ok: false,
      error: 'Synchronous /api/render is disabled. Use POST /api/generate-video instead.'
    }, { status: 400 });
  } catch (err: any) {
    console.error('Remotion render failed:', err);
    return Response.json({ ok: false, error: err?.message || 'Render failed' }, { status: 500 });
  }
}
