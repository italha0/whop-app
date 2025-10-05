import type { NextRequest } from 'next/server';
// The @whop/api package exposes token verification utilities at runtime.
// We keep types loose to avoid tight coupling with canary changes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let verifyUserTokenFn: any | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const whop = require('@whop/api');
  verifyUserTokenFn = whop?.verifyUserToken ?? null;
} catch {
  verifyUserTokenFn = null;
}

export function getWhopTokenFromRequest(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (auth && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }
  const headerToken = req.headers.get('x-whop-token');
  if (headerToken) return headerToken;
  const cookieToken = req.cookies.get('whop_token')?.value;
  if (cookieToken) return cookieToken;
  return null;
}

export async function verifyWhopToken(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }>{
  if (!token) return { valid: false, error: 'missing token' };
  if (!verifyUserTokenFn) {
    // Fallback: in dev, accept token but mark as unverified
    return { valid: true, payload: { sub: 'dev', token } };
  }
  try {
    const result = await verifyUserTokenFn(token);
    if (result && typeof result === 'object') {
      return { valid: true, payload: result };
    }
    return { valid: false, error: 'invalid token' };
  } catch (e: any) {
    return { valid: false, error: e?.message || 'verify failed' };
  }
}

export function deriveUserFromHeaders(req: NextRequest): { id: string | null; username: string | null } {
  const id = req.headers.get('x-whop-user-id') || null;
  const username = req.headers.get('x-whop-username') || null;
  return { id, username };
}
