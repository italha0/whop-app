import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/appwrite/server';
import { generateSASUrl } from '@/lib/azure-blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { databases } = await createServerClient();
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const doc = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID!,
      process.env.APPWRITE_COLLECTION_VIDEO_RENDERS_ID!,
      jobId
    );

    if (doc.status !== 'done') {
      return NextResponse.json({ error: 'Video not ready', status: doc.status }, { status: 400 });
    }

    if (!doc.blob_name) {
      return NextResponse.json({ error: 'No blob name found' }, { status: 404 });
    }

    const url = new URL(request.url);
    const filename = (url.searchParams.get('filename') || 'chat-video.mp4').replace(/[^A-Za-z0-9_.-]/g, '');
    const expParam = url.searchParams.get('exp');
    let expiryMinutes = 60;
    if (expParam) {
      const n = Number(expParam);
      if (Number.isFinite(n)) expiryMinutes = Math.min(1440, Math.max(1, Math.trunc(n)));
    }

    const sas = generateSASUrl(doc.blob_name, expiryMinutes);
    const azureResp = await fetch(sas, { cache: 'no-store' });
    if (!azureResp.ok || !azureResp.body) {
      const txt = await azureResp.text().catch(() => '');
      return NextResponse.json({ error: 'Blob fetch failed', status: azureResp.status, details: txt.slice(0, 200) }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
    }

    const headers = new Headers();
    headers.set('Content-Type', azureResp.headers.get('content-type') || 'video/mp4');
    const len = azureResp.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    headers.set('Cache-Control', 'no-store');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new Response(azureResp.body, { status: 200, headers });
  } catch (e: any) {
    if (e?.code === 404) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ error: e?.message || 'Download failed' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
