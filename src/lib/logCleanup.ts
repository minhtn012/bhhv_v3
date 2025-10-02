/**
 * Log Cleanup Job
 * Periodically clean up old logs based on retention policies
 */

import { getLogRetentionDays } from './logFilters';

/**
 * Clean up logs older than retention period for each level
 */
export async function cleanupOldLogs() {
  try {
    const SystemLog = (await import('@/models/SystemLog')).default;

    const levels = ['error', 'warn', 'info', 'http', 'debug'];
    let totalDeleted = 0;

    for (const level of levels) {
      const retentionDays = getLogRetentionDays(level);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await SystemLog.deleteMany({
        level,
        timestamp: { $lt: cutoffDate },
      });

      totalDeleted += result.deletedCount || 0;

      if (result.deletedCount && result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} ${level} logs older than ${retentionDays} days`);
      }
    }

    if (totalDeleted > 0) {
      console.log(`✓ Total logs cleaned: ${totalDeleted}`);
    }

    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('Failed to cleanup old logs:', error);
    return { success: false, error };
  }
}

/**
 * Start periodic cleanup (runs daily at 2 AM)
 */
export function startLogCleanupScheduler() {
  // Run cleanup daily at 2 AM
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  const runAtTime = () => {
    const now = new Date();
    const target = new Date(now);
    target.setHours(2, 0, 0, 0);

    // If already past 2 AM today, schedule for tomorrow
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }

    const msUntilTarget = target.getTime() - now.getTime();

    setTimeout(() => {
      cleanupOldLogs();
      // Schedule next run
      setInterval(cleanupOldLogs, CLEANUP_INTERVAL);
    }, msUntilTarget);
  };

  if (process.env.NODE_ENV === 'production') {
    runAtTime();
    console.log('✓ Log cleanup scheduler started (runs daily at 2 AM)');
  }
}
