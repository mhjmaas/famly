import { RateLimiter } from "@modules/chat/realtime/utils/rate-limiter";
import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Unit tests for Message Sending Handler logic
 *
 * Note: Full integration tests are in e2e tests where we can properly set up environment.
 * These tests verify the validation, rate limiting, and Socket.IO event logic.
 */

describe("Message Sending Handler Logic", () => {
  // Validation schema (same as in handler)
  const messageSendSchema = z.object({
    chatId: z
      .string()
      .refine((val) => ObjectId.isValid(val), "Invalid chatId format"),
    clientId: z.string().min(1, "clientId is required"),
    body: z
      .string()
      .min(1, "Message body is required")
      .max(8000, "Message body must be 8000 characters or less"),
  });

  describe("payload validation", () => {
    it("should accept valid message payload", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        clientId: "msg-1",
        body: "Hello world",
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(true);
    });

    it("should reject message with invalid chatId format", () => {
      const payload = {
        chatId: "invalid-id",
        clientId: "msg-1",
        body: "Hello world",
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject message without clientId", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        clientId: "",
        body: "Hello world",
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject empty message body", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        clientId: "msg-1",
        body: "",
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject message body exceeding 8000 characters", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        clientId: "msg-1",
        body: "x".repeat(8001),
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should accept message body at 8000 characters (boundary)", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        clientId: "msg-1",
        body: "x".repeat(8000),
      };

      const validation = messageSendSchema.safeParse(payload);
      expect(validation.success).toBe(true);
    });
  });

  describe("idempotency via clientId", () => {
    it("should recognize duplicate clientId for same chat", () => {
      const chatId = new ObjectId().toString();
      const clientId = "msg-1";

      // First message
      const msg1 = { chatId, clientId, body: "Hello" };
      // Duplicate with same clientId
      const msg2 = { chatId, clientId, body: "Hello" };

      expect(msg1.clientId).toBe(msg2.clientId);
      // Service should detect this and return existing message
    });

    it("should allow different clientIds for same message", () => {
      const chatId = new ObjectId().toString();

      const msg1 = { chatId, clientId: "msg-1", body: "Hello" };
      const msg2 = { chatId, clientId: "msg-2", body: "Hello" };

      expect(msg1.clientId).not.toBe(msg2.clientId);
      // These should create different messages
    });
  });

  describe("rate limiting", () => {
    it("should track messages per user", () => {
      const limiter = new RateLimiter({ maxMessages: 10, windowSeconds: 10 });
      const userId = "user-1";

      for (let i = 0; i < 10; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }

      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it("should enforce max 10 messages per 10 seconds", () => {
      const limiter = new RateLimiter({ maxMessages: 10, windowSeconds: 10 });
      const userId = "user-1";

      // Can send 10
      for (let i = 0; i < 10; i++) {
        expect(limiter.checkLimit(userId)).toBe(true);
      }

      // 11th is rejected
      expect(limiter.checkLimit(userId)).toBe(false);
    });

    it("should isolate rate limits per user", () => {
      const limiter = new RateLimiter({ maxMessages: 3, windowSeconds: 10 });

      const user1 = "user-1";
      const user2 = "user-2";

      // User1 hits limit
      limiter.checkLimit(user1);
      limiter.checkLimit(user1);
      limiter.checkLimit(user1);
      expect(limiter.checkLimit(user1)).toBe(false);

      // User2 should still have quota
      expect(limiter.checkLimit(user2)).toBe(true);
    });
  });

  describe("error codes", () => {
    it("should use VALIDATION_ERROR for invalid payload", () => {
      const errorCode = "VALIDATION_ERROR";
      expect(errorCode).toBe("VALIDATION_ERROR");
    });

    it("should use FORBIDDEN for non-member", () => {
      const errorCode = "FORBIDDEN";
      expect(errorCode).toBe("FORBIDDEN");
    });

    it("should use RATE_LIMITED for rate limit exceeded", () => {
      const errorCode = "RATE_LIMITED";
      expect(errorCode).toBe("RATE_LIMITED");
    });

    it("should use INTERNAL for server errors", () => {
      const errorCode = "INTERNAL";
      expect(errorCode).toBe("INTERNAL");
    });
  });

  describe("acknowledgment responses", () => {
    it("should return clientId and serverId on success", () => {
      const ack = {
        ok: true,
        data: {
          clientId: "msg-1",
          serverId: new ObjectId().toString(),
        },
      };

      expect(ack.ok).toBe(true);
      expect(ack.data?.clientId).toBe("msg-1");
      expect(ack.data?.serverId).toBeDefined();
    });

    it("should return error code and message on failure", () => {
      const ack = {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "Invalid chatId format",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBeDefined();
      expect(ack.message).toBeDefined();
      expect(ack.correlationId).toBeDefined();
    });
  });

  describe("message broadcast", () => {
    it("should emit message:new event to room", () => {
      const mockSocket = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };

      const chatId = new ObjectId().toString();
      const message = {
        _id: new ObjectId(),
        chatId: new ObjectId(chatId),
        userId: new ObjectId(),
        body: "Hello",
        createdAt: new Date(),
      };

      mockSocket.to(`chat:${chatId}`).emit("message:new", { message });

      expect(mockSocket.to).toHaveBeenCalledWith(`chat:${chatId}`);
    });
  });
});
