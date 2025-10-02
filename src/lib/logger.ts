/**
 * Enhanced logging system for debugging and monitoring
 * Supports both file-based and console logging with context
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'http';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isTest = process.env.NODE_ENV === 'test';
  private enableDbLogging = process.env.ENABLE_DB_LOGGING === 'true';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);

    let logMessage = `[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      logMessage += '\n' + JSON.stringify(context, null, 2);
    }

    return logMessage;
  }

  private getEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍',
      http: '🌐',
    };
    return emojis[level];
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isTest) return false;

    if (this.isDevelopment) return true;

    // Production: only log warn and error
    return ['error', 'warn'].includes(level);
  }

  private saveToDatabase(level: LogLevel, message: string, context?: LogContext) {
    // Only save to DB if enabled and not in test mode
    if (!this.enableDbLogging || this.isTest) return;

    try {
      // Apply filtering rules
      const { shouldSaveToDatabase } = require('@/lib/logFilters');
      if (!shouldSaveToDatabase(level, context?.path)) {
        return; // Skip saving to DB
      }

      // Use queue for non-blocking async insert
      const { logQueue } = require('@/lib/logQueue');

      logQueue.enqueue({
        timestamp: new Date(),
        level,
        message,
        context,
        method: context?.method,
        path: context?.path,
        ip: context?.ip,
        userAgent: context?.userAgent,
        status: context?.status,
        duration: context?.duration,
        error: context?.error,
        stack: context?.stack,
        userId: context?.userId,
        username: context?.username,
        metadata: context,
      });
    } catch (error) {
      // Fail silently to avoid breaking app if queueing fails
      console.error('Failed to queue log:', error);
    }
  }

  error(message: string, context?: LogContext) {
    if (!this.shouldLog('error')) return;
    // Only show in console for development
    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, context));
    }
    this.saveToDatabase('error', message, context);
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return;
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, context));
    }
    this.saveToDatabase('warn', message, context);
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, context));
    }
    this.saveToDatabase('info', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return;
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
    this.saveToDatabase('debug', message, context);
  }

  http(message: string, context?: LogContext) {
    if (!this.shouldLog('http')) return;
    // HTTP logs are very noisy, skip console in production
    if (this.isDevelopment && process.env.LOG_HTTP_TO_CONSOLE === 'true') {
      console.log(this.formatMessage('http', message, context));
    }
    this.saveToDatabase('http', message, context);
  }

  // API-specific logging helpers
  apiRequest(method: string, url: string, data?: any) {
    this.http(`API Request: ${method} ${url}`, {
      method,
      url,
      requestData: data,
    });
  }

  apiResponse(method: string, url: string, status: number, data?: any, duration?: number) {
    const level = status >= 400 ? 'error' : 'http';
    this[level](`API Response: ${method} ${url} - ${status}`, {
      method,
      url,
      status,
      responseData: data,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  apiError(method: string, url: string, error: any) {
    this.error(`API Error: ${method} ${url}`, {
      method,
      url,
      error: error.message,
      stack: error.stack,
      response: error.response?.data,
      status: error.response?.status,
    });
  }

  // Contract-specific logging
  contractAction(action: string, contractId: string, details?: LogContext) {
    this.info(`Contract Action: ${action}`, {
      contractId,
      action,
      ...details,
    });
  }

  contractError(action: string, contractId: string, error: any, details?: LogContext) {
    this.error(`Contract Error: ${action}`, {
      contractId,
      action,
      error: error.message,
      stack: error.stack,
      ...details,
    });
  }

  // BHV API specific logging
  bhvSubmission(contractId: string, stage: string, details?: LogContext) {
    this.info(`BHV Submission - ${stage}`, {
      contractId,
      stage,
      ...details,
    });
  }

  bhvError(contractId: string, stage: string, error: any, additionalContext?: LogContext) {
    this.error(`BHV Submission Failed - ${stage}`, {
      contractId,
      stage,
      error: error?.message || error,
      stack: error?.stack,
      response: error?.response?.data,
      ...additionalContext, // Merge additional context (requestData, cookies, etc)
    });
  }
}

export const logger = new Logger();
export default logger;
