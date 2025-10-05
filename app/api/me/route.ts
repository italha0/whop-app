import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyWhopToken } from '@/lib/whop-auth';

// Minimal user endpoint. In production, verify the Whop user token header/cookie
// and fetch the user via @whop/api as needed.
export async function GET() {
  const hdrs = await headers();
  const cookieStore = await cookies();
  const userId = hdrs.get('x-whop-user-id') || cookieStore.get('whop_user_id')?.value;
  const username = hdrs.get('x-whop-username') || null;
  const token = cookieStore.get('whop_token')?.value || hdrs.get('x-whop-token') || '';

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  let verified: Record<string, unknown> | null = null;
  if (token) {
    const r = await verifyWhopToken(token);
    if (r.valid && r.payload) verified = r.payload as Record<string, unknown>;
  }

  return NextResponse.json({
    user: {
      id: userId,
      username,
      verified, // may contain Whop-provided claims
    },
  });
}
