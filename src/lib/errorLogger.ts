/**
 * Centralized Error Logger
 * Provides consistent error logging with full context across the application
 */

import { logger } from './logger';

export interface ErrorContext {
  operation: string;          // Operation identifier (e.g., "GET_CONTRACT", "BHV_PREMIUM_CHECK")
  contractId?: string;
  contractNumber?: string;
  userId?: string;
  username?: string;
  path?: string;
  method?: string;
  requestData?: any;
  responseData?: any;
  duration?: number;
  additionalInfo?: Record<string, any>;
}

/**
 * Log error with full context and stack trace
 * Replaces scattered console.error calls with structured logging
 */
export function logError(error: unknown, context: ErrorContext): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`${context.operation} failed`, {
    operation: context.operation,
    error: errorMessage,
    stack: errorStack,
    contractId: context.contractId,
    contractNumber: context.contractNumber,
    userId: context.userId,
    username: context.username,
    path: context.path,
    method: context.method,
    requestData: sanitizeLogData(context.requestData),
    responseData: sanitizeLogData(context.responseData),
    duration: context.duration ? `${context.duration}ms` : undefined,
    ...context.additionalInfo,
  });
}

/**
 * Log debug information (only in development or when LOG_LEVEL=debug)
 * Replaces console.log calls
 */
export function logDebug(message: string, data?: Record<string, any>): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebugLevel = process.env.LOG_LEVEL === 'debug';

  if (isDevelopment || isDebugLevel) {
    logger.debug(message, sanitizeLogData(data));
  }
}

/**
 * Log info for important operations
 * Use for operation milestones (start, success, completion)
 */
export function logInfo(message: string, context: Partial<ErrorContext>): void {
  logger.info(message, {
    operation: context.operation,
    contractId: context.contractId,
    contractNumber: context.contractNumber,
    userId: context.userId,
    username: context.username,
    duration: context.duration ? `${context.duration}ms` : undefined,
    ...context.additionalInfo,
  });
}

/**
 * Log warning for non-critical issues
 */
export function logWarning(message: string, context: Partial<ErrorContext>): void {
  logger.warn(message, {
    operation: context.operation,
    contractId: context.contractId,
    userId: context.userId,
    path: context.path,
    ...context.additionalInfo,
  });
}

/**
 * Sanitize sensitive data from logs
 * Prevents logging passwords, tokens, API keys
 */
function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = [
    'password',
    'token',
    'accesstoken',
    'refreshtoken',
    'secret',
    'apikey',
    'cookie',
    'cookies',
    'authorization',
    'auth',
  ];

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive information
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Create error response with details in development mode
 */
export function createErrorResponse(error: unknown, defaultMessage = 'Internal server error'): {
  error: string;
  details?: string;
} {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    error: defaultMessage,
    ...(isDevelopment && {
      details: error instanceof Error ? error.message : String(error),
    }),
  };
}

/**
 * Operation timer utility
 * Use to measure operation duration
 */
export class OperationTimer {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsed(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Log completion with duration
   */
  logCompletion(operation: string, context?: Partial<ErrorContext>): void {
    logInfo(`${operation} completed`, {
      ...context,
      operation,
      duration: this.getElapsed(),
    });
  }

  /**
   * Log error with duration
   */
  logError(error: unknown, operation: string, context?: Partial<ErrorContext>): void {
    logError(error, {
      operation,
      duration: this.getElapsed(),
      ...context,
    } as ErrorContext);
  }
}
