import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
	// No authentication middleware needed - Whop handles authentication
	return NextResponse.next();
}
