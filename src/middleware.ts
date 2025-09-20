import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect account and admin routes - redirect to sign-in if not authenticated
  if (pathname.startsWith('/account') || pathname.startsWith('/admin')) {
    // Check for better-auth session token cookie
    const authSession = request.cookies.get('better-auth.session_token');
    
    // If no session cookie exists or it has no value, redirect to sign-in
    if (!authSession || !authSession.value) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/admin/:path*',
  ],
};
