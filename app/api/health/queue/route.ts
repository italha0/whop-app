import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const queueEnabled = process.env.RENDER_QUEUE_ENABLED === 'true';
    const redisUrl = process.env.REDIS_URL || '';
    const hasRedisUrl = Boolean(redisUrl);
    const redisScheme = redisUrl ? (redisUrl.split(':')[0] || null) : null;
  const appwriteConfigured = Boolean(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) && Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    return NextResponse.json({
      queueEnabled,
      hasRedisUrl,
      redisScheme,
  appwriteConfigured,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
