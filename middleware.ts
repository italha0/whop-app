
export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)'],
};

export default function middleware() {
  // TODO: add auth protection once Whop token verification is implemented
}