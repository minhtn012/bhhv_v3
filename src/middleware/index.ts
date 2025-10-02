/**
 * Middleware Helpers
 * Export common middleware and helpers for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { withApiLogger, ApiLoggerOptions } from './apiLogger';

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<
    (request: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse>
  >
) {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    let index = 0;

    async function next(): Promise<NextResponse> {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        return middleware(request, next);
      }
      return handler();
    }

    return next();
  };
}

/**
 * Default middleware stack for API routes
 */
export function withDefaultMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options?: ApiLoggerOptions
) {
  return withApiLogger(request, handler, options);
}

/**
 * Middleware for authenticated routes
 */
export async function withAuth(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const { getAuthUser } = await import('@/lib/auth');
    const user = getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    return handler();
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
}

/**
 * Middleware for admin-only routes
 */
export async function withAdmin(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const { getAuthUser } = await import('@/lib/auth');
    const user = getAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    return handler();
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid token' },
      { status: 401 }
    );
  }
}

/**
 * Example: Combining multiple middleware
 * Usage:
 * export async function POST(request: NextRequest) {
 *   return withMiddleware(
 *     request,
 *     async () => { ... handler logic ... },
 *     [withAuth, withApiLogger]
 *   );
 * }
 */
export async function withMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  middlewares: Array<
    (req: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse>
  >
): Promise<NextResponse> {
  const composed = composeMiddleware(...middlewares);
  return composed(request, handler);
}

export { withApiLogger } from './apiLogger';
