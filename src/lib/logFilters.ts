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
  levelsToSave: ['error', 'warn', 'info'], // Include info for important operations

  // Don't save these to DB (too noisy)
  excludePaths: [
    '/api/health',
    '/api/ping',
    '/_next/',
    '/favicon.ico',
    '/static/',
    '/__nextjs',
    '/api/auth/me', // Too frequent, only log errors
  ],

  // Only log errors for these paths
  errorOnlyPaths: [
    '/api/auth/refresh',
    '/api/auth/me',
    '/api/users/dashboard-stats',
    '/api/admin/dashboard-stats',
  ],

  // Log 5% of HTTP requests to DB (reduced from 10% to further reduce noise)
  httpLogSampleRate: 0.05,
};

/**
 * Check if log should be saved to database
 */
export function shouldSaveToDatabase(
  level: string,
  path?: string,
  config: LogFilterConfig = defaultLogFilterConfig
): boolean {
  // ALWAYS save BHV-related logs (critical for debugging)
  if (path && path.includes('/submit-to-bhv')) {
    return true;
  }

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
 * All logs kept for 7 days
 */
export function getLogRetentionDays(level: string): number {
  return 7; // All logs: 7 days retention
}
