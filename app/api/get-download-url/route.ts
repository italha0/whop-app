import { NextRequest, NextResponse } from 'next/server';
import { generateSASUrl } from '@/lib/azure-blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function validateBlobName(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const name = input.trim();
  if (!name) return null;
  // Basic safety: disallow parent directory segments
  if (name.includes('..')) return null;
  return name;
}

export async function GET(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'GET' } });
  }

  try {
    const url = new URL(req.url);
    const blobNameRaw = url.searchParams.get('blobName');
    const blobName = validateBlobName(blobNameRaw);
    if (!blobName) {
      return NextResponse.json({ error: 'Missing or invalid blobName' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
    }

    // Optional expiry in minutes (default 60). Bound between 1 and 1440.
    const exp = url.searchParams.get('exp');
    let expiryMinutes = 60;
    if (exp) {
      const n = Number(exp);
      if (Number.isFinite(n)) expiryMinutes = Math.min(1440, Math.max(1, Math.trunc(n)));
    }

    const signed = generateSASUrl(blobName, expiryMinutes);
    return NextResponse.json({ url: signed }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to generate download URL' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
