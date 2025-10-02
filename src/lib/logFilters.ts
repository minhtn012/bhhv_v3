/**
 * Log Filtering Rules
 * Configure which logs should be saved to database
 */

export interface LogFilterConfig {
  // Only log these levels to DB (others only console)
  levelsToSave: string[];

  // Paths to exclude from DB logging
  excludePaths: string[];

  // Only log errors for these paths
  errorOnlyPaths: string[];

  // Sample rate for HTTP logs (0-1, e.g., 0.1 = 10% of requests)
  httpLogSampleRate: number;
}

export const defaultLogFilterConfig: LogFilterConfig = {
  // Only save errors and warnings to DB by default
  levelsToSave: ['error', 'warn'],

  // Don't save these to DB (too noisy)
  excludePaths: [
    '/api/health',
    '/api/ping',
    '/_next/',
    '/favicon.ico',
  ],

  // Only log errors for these paths
  errorOnlyPaths: [
    '/api/auth/refresh',
  ],

  // Log 10% of HTTP requests to DB (reduce noise)
  httpLogSampleRate: 0.1,
};

/**
 * Check if log should be saved to database
 */
export function shouldSaveToDatabase(
  level: string,
  path?: string,
  config: LogFilterConfig = defaultLogFilterConfig
): boolean {
  // Always exclude certain paths
  if (path && config.excludePaths.some(p => path.includes(p))) {
    return false;
  }

  // For error-only paths, only save errors
  if (path && config.errorOnlyPaths.some(p => path.includes(p))) {
    return level === 'error';
  }

  // Check if level should be saved
  if (!config.levelsToSave.includes(level)) {
    // For HTTP logs, use sampling
    if (level === 'http') {
      return Math.random() < config.httpLogSampleRate;
    }
    return false;
  }

  return true;
}

/**
 * Get log retention period based on level
 */
export function getLogRetentionDays(level: string): number {
  const retention: Record<string, number> = {
    error: 90,   // Keep errors for 90 days
    warn: 30,    // Keep warnings for 30 days
    info: 7,     // Keep info for 7 days
    http: 3,     // Keep HTTP logs for 3 days
    debug: 1,    // Keep debug for 1 day
  };

  return retention[level] || 7;
}
