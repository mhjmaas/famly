/**
 * In-memory rate limiter using sliding window algorithm
 * Tracks message rate per user (max 10 messages per 10 seconds)
 */

interface RateLimitConfig {
  maxMessages: number;
  windowSeconds: number;
}

export class RateLimiter {
  private userTimestamps: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(
    config: RateLimitConfig = { maxMessages: 10, windowSeconds: 10 },
  ) {
    this.config = config;
  }

  /**
   * Check if a user has exceeded rate limit
   * Returns true if under limit (allowed), false if over limit (rate limited)
   *
   * @param userId User identifier
   * @returns true if message is allowed, false if rate limited
   */
  checkLimit(userId: string): boolean {
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;

    // Get or initialize user's timestamp list
    let timestamps = this.userTimestamps.get(userId) || [];

    // Remove timestamps outside the sliding window
    timestamps = timestamps.filter((ts) => now - ts < windowMs);

    // Check if user has exceeded rate limit
    if (timestamps.length >= this.config.maxMessages) {
      return false; // Rate limited
    }

    // Add current timestamp and update map
    timestamps.push(now);
    this.userTimestamps.set(userId, timestamps);

    return true; // Allowed
  }

  /**
   * Reset rate limit for a user (useful for testing)
   */
  reset(userId?: string): void {
    if (userId) {
      this.userTimestamps.delete(userId);
    } else {
      this.userTimestamps.clear();
    }
  }

  /**
   * Get current message count for a user in the current window
   * (for testing and monitoring purposes)
   */
  getMessageCount(userId: string): number {
    const now = Date.now();
    const windowMs = this.config.windowSeconds * 1000;

    const timestamps = this.userTimestamps.get(userId) || [];
    return timestamps.filter((ts) => now - ts < windowMs).length;
  }
}

// Global singleton rate limiter
let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();
  }
  return globalRateLimiter;
}

/**
 * Reset the global rate limiter (useful for testing)
 */
export function resetRateLimiter(): void {
  globalRateLimiter = null;
}
