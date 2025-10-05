export async function POST(req: Request) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) return new Response('Missing secret', { status: 500 });
  const sig = req.headers.get('x-whop-signature') || req.headers.get('x-whop-secret');
  if (sig !== secret) return new Response('Unauthorized', { status: 401 });
  const body = await req.json().catch(() => ({}));
  // TODO: handle specific event types in `body`
  return Response.json({ received: true });
}

export async function GET() {
  return new Response('OK');
}