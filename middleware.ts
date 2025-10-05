import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // Run on all pages; let API routes handle their own auth
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};

// Simple contract:
// - If the Whop dev proxy forwards x-whop-user-id/x-whop-username, persist to cookie for client usage
// - Attach x-whop-* headers to the request for server components/route handlers
// - Soft-protect app pages under /editor, /projects, /renders, /settings
export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const resHeaders = new Headers();

  const hdrUserId = req.headers.get('x-whop-user-id');
  const hdrUsername = req.headers.get('x-whop-username');
  const cookieUser = req.cookies.get('whop_user_id')?.value;

  let userId = cookieUser || hdrUserId || '';
  const isAuthed = Boolean(userId);

  // Persist incoming dev-proxy headers to cookies so client can read minimal state
  // Note: In a real app, prefer a signed session cookie and server-only verification.
  const response = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers),
        ...(hdrUserId ? { 'x-whop-user-id': hdrUserId } : {}),
        ...(hdrUsername ? { 'x-whop-username': hdrUsername } : {}),
      }),
    },
  });

  if (hdrUserId && hdrUserId !== cookieUser) {
    response.cookies.set('whop_user_id', hdrUserId, {
      httpOnly: false, // readable by client hook for now
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    userId = hdrUserId;
  }

  // Soft-protect certain app areas
  const protectedPrefixes = ['/editor', '/projects', '/renders', '/settings'];
  const needsAuth = protectedPrefixes.some((p) => url.pathname.startsWith(p));
  if (needsAuth && !isAuthed) {
    url.pathname = '/pricing';
    return NextResponse.redirect(url);
  }

  return response;
}