import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

// Minimal user endpoint. In production, verify the Whop user token header/cookie
// and fetch the user via @whop/api as needed.
export async function GET() {
  const hdrs = await headers();
  const cookieStore = await cookies();
  const userId = hdrs.get('x-whop-user-id') || cookieStore.get('whop_user_id')?.value;
  const username = hdrs.get('x-whop-username') || null;

  if (!userId) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: userId,
      username,
    },
  });
}
