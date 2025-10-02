/**
 * Performance test for logger
 * Run: npm test -- logger.performance.test.ts
 */

import { logger } from '../logger';

describe('Logger Performance', () => {
  it('should handle 1000 logs without blocking', async () => {
    const startTime = Date.now();

    // Log 1000 times
    for (let i = 0; i < 1000; i++) {
      logger.info(`Test log ${i}`, { iteration: i });
    }

    const duration = Date.now() - startTime;

    // Should complete in less than 100ms (non-blocking)
    expect(duration).toBeLessThan(100);

    console.log(`✓ Logged 1000 messages in ${duration}ms`);
    console.log(`  Average: ${(duration / 1000).toFixed(2)}ms per log`);
  });

  it('should not block API responses', async () => {
    const mockApiHandler = async () => {
      const start = Date.now();

      // Simulate logging in API
      logger.http('API Request', {
        method: 'POST',
        path: '/api/test',
        status: 200,
      });

      logger.info('Processing request');
      logger.debug('Request details', { foo: 'bar' });

      const duration = Date.now() - start;
      return duration;
    };

    const duration = await mockApiHandler();

    // Logging should add < 5ms overhead
    expect(duration).toBeLessThan(5);

    console.log(`✓ API handler with logging: ${duration}ms overhead`);
  });
});
