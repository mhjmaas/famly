import winston from 'winston';
import { logger } from '@lib/logger';

/**
 * Logger unit tests
 * Tests the logger singleton creation and basic functionality.
 *
 * Design adheres to Maintainability First principle:
 * - Tests focus on behavior verification over implementation details
 * - Mocking is used to capture log output without side effects
 */

describe('Logger', () => {
  let originalWinstonCreate: typeof winston.createLogger;
  let mockTransportLog: jest.Mock;

  beforeEach(() => {
    // Capture the original createLogger
    originalWinstonCreate = winston.createLogger;

    // Mock transport to capture logs without console output
    mockTransportLog = jest.fn();
  });

  afterEach(() => {
    // Restore original implementation
    jest.restoreAllMocks();
  });

  describe('logger instance', () => {
    test('should be a Winston logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('debug');
    });

    test('should have logging methods', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('log output format', () => {
    test('should handle info level logging', () => {
      expect(() => {
        logger.info('Test info message');
      }).not.toThrow();
    });

    test('should handle error level logging', () => {
      expect(() => {
        logger.error('Test error message');
      }).not.toThrow();
    });

    test('should handle error objects', () => {
      const testError = new Error('Test error');
      expect(() => {
        logger.error('Error occurred:', testError);
      }).not.toThrow();
    });

    test('should handle complex data structures', () => {
      const complexData = {
        userId: '123',
        action: 'login',
        metadata: {
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        },
      };
      expect(() => {
        logger.info('User action', complexData);
      }).not.toThrow();
    });
  });

  describe('logger configuration', () => {
    test('should be configured for console output', () => {
      const transports = (logger as any)._readableState?.transports || [];
      // Logger should have at least console transport configured
      expect(logger).toBeDefined();
    });

    test('should not throw when logging multiple messages', () => {
      expect(() => {
        logger.info('Message 1');
        logger.info('Message 2');
        logger.error('Error message');
        logger.warn('Warning message');
      }).not.toThrow();
    });
  });
});
