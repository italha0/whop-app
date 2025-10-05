import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  return NextResponse.json({ error: 'This endpoint has moved to /api/generate-video' }, { status: 410 });
}
