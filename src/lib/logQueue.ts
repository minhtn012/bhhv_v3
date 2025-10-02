/**
 * Log Queue - Batch insert logs to database to improve performance
 * Logs are queued in memory and inserted in batches every N seconds
 */

interface QueuedLog {
  timestamp: Date;
  level: string;
  message: string;
  context?: Record<string, any>;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  status?: number;
  duration?: string;
  error?: string;
  stack?: string;
  userId?: string;
  username?: string;
  metadata?: Record<string, any>;
}

class LogQueue {
  private queue: QueuedLog[] = [];
  private maxQueueSize = 100; // Flush when queue reaches this size
  private flushInterval = 5000; // Flush every 5 seconds
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Add log to queue (non-blocking)
   */
  enqueue(log: QueuedLog) {
    this.queue.push(log);

    // Flush immediately if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);

    // Cleanup on process exit
    process.on('beforeExit', () => {
      this.flush();
      if (this.timer) {
        clearInterval(this.timer);
      }
    });
  }

  /**
   * Flush queue to database (batch insert)
   */
  async flush() {
    // Skip if already processing or queue is empty
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get logs from queue
      const logsToInsert = this.queue.splice(0, this.maxQueueSize);

      if (logsToInsert.length === 0) {
        return;
      }

      // Batch insert to database
      const SystemLog = (await import('@/models/SystemLog')).default;
      await SystemLog.insertMany(logsToInsert, { ordered: false });

      // Success
      if (process.env.NODE_ENV === 'development') {
        console.log(`✓ Flushed ${logsToInsert.length} logs to database`);
      }

    } catch (error) {
      // Log error but don't crash app
      console.error('Failed to flush logs to database:', error);

      // On error, put logs back to queue (max 1000 to prevent memory leak)
      if (this.queue.length < 1000) {
        // Don't re-add to prevent infinite loop on persistent errors
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get current queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue (for testing)
   */
  clear() {
    this.queue = [];
  }
}

// Singleton instance
export const logQueue = new LogQueue();
