import { NextRequest, NextResponse } from 'next/server';

// Dev helper: sets a temporary session for a "Free" user and redirects to the requested path.
// This avoids the pricing redirect on protected pages during local development.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/editor';
  const safeNext = next.startsWith('/') ? next : '/editor';

  const redirectTo = new URL(safeNext, url.origin);
  const res = NextResponse.redirect(redirectTo, 303);

  // Minimal dev identity. In production, this should be a signed session with real user data.
  const userId = 'free-dev-user';
  const devToken = 'dev-token';

  // Client-readable user id (temporary; switch to server-only session when ready)
  res.cookies.set('whop_user_id', userId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  // Server-verified token placeholder (HttpOnly)
  res.cookies.set('whop_token', devToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
