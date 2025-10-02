import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from '@/lib/jwt-edge';

/**
 * Next.js Middleware for route protection
 * Validates JWT tokens before allowing access to protected routes
 * Uses Edge Runtime compatible JWT verification
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie
  const token = request.cookies.get('token')?.value;

  console.log('Middleware - Path:', pathname);
  console.log('Middleware - Token exists:', !!token);

  // If no token, redirect to login
  if (!token) {
    console.log('Middleware - No token found, redirecting to login');
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token validity (async for Edge Runtime)
  const payload = await verifyTokenEdge(token);
  console.log('Middleware - Token valid:', !!payload, 'Role:', payload?.role);

  if (!payload) {
    // Token is invalid or expired
    console.log('Middleware - Invalid token, redirecting to login');
    const response = NextResponse.redirect(new URL('/', request.url));

    // Clear invalid token
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0)
    });

    return response;
  }

  // Check admin-only routes
  const isAdminRoute = pathname.startsWith('/dashboard/users');
  if (isAdminRoute && payload.role !== 'admin') {
    // Non-admin trying to access admin route
    console.log('Middleware - Non-admin accessing admin route, redirecting');
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