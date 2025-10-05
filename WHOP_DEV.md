# Whop App Integration (Local Dev)

This app is wired to use Whop auth/webhooks via `@whop-apps/sdk` and the Whop Dev Proxy for local development.

## Prerequisites
- Copy `.env.example` to `.env.local` and fill:
  - `WHOP_API_KEY`
  - `WHOP_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_SITE_URL` (defaults to http://localhost:5000)

## Install deps
Use pnpm to install the new packages:

1) @whop/api (server SDK)
2) @whop-apps/dev-proxy (dev-only)

## Run locally
- Start Next.js on port 5000 (already configured):
  - `pnpm dev`
- In another terminal, start the Whop Dev Proxy:
  - `pnpm whop:proxy`

The dev proxy forwards Whop OAuth and Webhook calls to your local app.

## Files of interest
- `whop.config.ts` – Server auth bootstrap with `WHOP_API_KEY`
- `middleware.ts` – Route protection via `WhopNextJS.protect`
- `app/api/auth/[...whop]/route.ts` – OAuth callback routes
- `app/api/whop/webhook/route.ts` – Webhook handler (uses `WHOP_WEBHOOK_SECRET`)
- `hooks/useWhopAuth.ts` – Client auth hook via `createWhop()`

## Production
- Ensure `WHOP_API_KEY` and `WHOP_WEBHOOK_SECRET` are set in your hosting provider.
- Update `NEXT_PUBLIC_SITE_URL` to your production domain for correct absolute URLs.
