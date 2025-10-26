import { RateLimiter } from "@modules/chat/realtime/utils/rate-limiter";

describe("RateLimiter", () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Create a fast rate limiter for testing (5 messages per 100ms)
    rateLimiter = new RateLimiter({ maxMessages: 5, windowSeconds: 0.1 });
  });

  describe("checkLimit", () => {
    it("should allow messages under the limit", () => {
      const userId = "user-1";

      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(userId)).toBe(true);
      }
    });

    it("should reject messages when limit is exceeded", () => {
      const userId = "user-1";

      // Send 5 messages (at limit)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(userId)).toBe(true);
      }

      // 6th message should be rejected
      expect(rateLimiter.checkLimit(userId)).toBe(false);
    });

    it("should isolate rate limits per user", () => {
      const user1 = "user-1";
      const user2 = "user-2";

      // User 1 hits limit
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(user1)).toBe(true);
      }
      expect(rateLimiter.checkLimit(user1)).toBe(false);

      // User 2 should still have quota
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(user2)).toBe(true);
      }
    });

    it("should reset limits after window expires", async () => {
      const userId = "user-1";

      // Send 5 messages (hit limit)
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.checkLimit(userId)).toBe(true);
      }
      expect(rateLimiter.checkLimit(userId)).toBe(false);

      // Wait for window to expire (100ms + buffer)
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be able to send again
      expect(rateLimiter.checkLimit(userId)).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset all users when called without userId", () => {
      const user1 = "user-1";
      const user2 = "user-2";

      // Both users hit their limits
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(user1);
        rateLimiter.checkLimit(user2);
      }

      expect(rateLimiter.checkLimit(user1)).toBe(false);
      expect(rateLimiter.checkLimit(user2)).toBe(false);

      // Reset all
      rateLimiter.reset();

      // Both should have quota again
      expect(rateLimiter.checkLimit(user1)).toBe(true);
      expect(rateLimiter.checkLimit(user2)).toBe(true);
    });

    it("should reset specific user when userId is provided", () => {
      const user1 = "user-1";
      const user2 = "user-2";

      // Both users hit their limits
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkLimit(user1);
        rateLimiter.checkLimit(user2);
      }

      // Reset only user1
      rateLimiter.reset(user1);

      // User1 should have quota, user2 should still be limited
      expect(rateLimiter.checkLimit(user1)).toBe(true);
      expect(rateLimiter.checkLimit(user2)).toBe(false);
    });
  });

  describe("getMessageCount", () => {
    it("should return correct message count", () => {
      const userId = "user-1";

      expect(rateLimiter.getMessageCount(userId)).toBe(0);

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getMessageCount(userId)).toBe(1);

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getMessageCount(userId)).toBe(2);

      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getMessageCount(userId)).toBe(3);
    });

    it("should not count timestamps outside window", async () => {
      const userId = "user-1";

      // Send 2 messages
      rateLimiter.checkLimit(userId);
      rateLimiter.checkLimit(userId);
      expect(rateLimiter.getMessageCount(userId)).toBe(2);

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Count should be 0 now
      expect(rateLimiter.getMessageCount(userId)).toBe(0);
    });
  });

  describe("configuration", () => {
    it("should respect custom limits", () => {
      const customLimiter = new RateLimiter({ maxMessages: 3, windowSeconds: 10 });
      const userId = "user-1";

      // Can send 3 messages
      expect(customLimiter.checkLimit(userId)).toBe(true);
      expect(customLimiter.checkLimit(userId)).toBe(true);
      expect(customLimiter.checkLimit(userId)).toBe(true);

      // 4th is rejected
      expect(customLimiter.checkLimit(userId)).toBe(false);
    });
  });
});
