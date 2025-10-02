/**
 * API Logging Middleware
 * Automatically logs all API requests and responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export interface ApiLoggerOptions {
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  excludePaths?: string[];
}

/**
 * Middleware to log API requests and responses
 */
export async function withApiLogger(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  options: ApiLoggerOptions = {}
): Promise<NextResponse> {
  const {
    logRequestBody = true,
    logResponseBody = false,
    excludePaths = [],
  } = options;

  const startTime = Date.now();
  const method = request.method;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Skip logging for excluded paths
  if (excludePaths.some(path => pathname.includes(path))) {
    return handler();
  }

  // Extract request metadata
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log request
  const requestLog: Record<string, any> = {
    method,
    path: pathname,
    query: Object.fromEntries(url.searchParams),
    ip,
    userAgent,
  };

  if (logRequestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      // Clone request to read body without consuming it
      const clonedRequest = request.clone();
      const body = await clonedRequest.json().catch(() => null);
      if (body) {
        // Sanitize sensitive fields
        requestLog.body = sanitizeSensitiveData(body);
      }
    } catch (error) {
      // Body might not be JSON, skip logging
    }
  }

  logger.http(`API Request: ${method} ${pathname}`, requestLog);

  try {
    // Execute handler
    const response = await handler();
    const duration = Date.now() - startTime;

    // Log response
    const responseLog: Record<string, any> = {
      method,
      path: pathname,
      status: response.status,
      duration: `${duration}ms`,
    };

    if (logResponseBody) {
      try {
        // Clone response to read body
        const clonedResponse = response.clone();
        const responseData = await clonedResponse.json().catch(() => null);
        if (responseData) {
          responseLog.body = sanitizeSensitiveData(responseData);
        }
      } catch (error) {
        // Response might not be JSON
      }
    }

    // Use appropriate log level based on status
    if (response.status >= 500) {
      logger.error(`API Response: ${method} ${pathname} - ${response.status}`, responseLog);
    } else if (response.status >= 400) {
      logger.warn(`API Response: ${method} ${pathname} - ${response.status}`, responseLog);
    } else {
      logger.http(`API Response: ${method} ${pathname} - ${response.status}`, responseLog);
    }

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error(`API Error: ${method} ${pathname}`, {
      method,
      path: pathname,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      ip,
    });

    throw error;
  }
}

/**
 * Sanitize sensitive data from logs
 */
function sanitizeSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'accessToken',
    'refreshToken',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'cookie',
    'cookies',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Extract user info from request (if authenticated)
 */
export function extractUserFromRequest(request: NextRequest): { userId?: string; username?: string } | null {
  try {
    // Try to get user from cookie token
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    // Decode JWT (simplified - in production use proper JWT verification)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    return {
      userId: payload.userId,
      username: payload.username,
    };
  } catch (error) {
    return null;
  }
}
