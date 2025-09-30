import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/**
 * Next.js Middleware for route protection
 * Validates JWT tokens before allowing access to protected routes
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get('token')?.value;

  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token validity
  const payload = verifyToken(token);
  if (!payload) {
    // Token is invalid or expired
    const response = NextResponse.redirect(new URL('/', request.url));

    // Clear invalid token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0)
    });

    return response;
  }

  // Check admin-only routes
  const isAdminRoute = pathname.startsWith('/dashboard/users');
  if (isAdminRoute && payload.role !== 'admin') {
    // Non-admin trying to access admin route
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add user info to request headers for easy access in pages
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-role', payload.role);

  return response;
}

/**
 * Configure which routes to protect
 */
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/contracts/:path*',
  ]
};