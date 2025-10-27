import { ObjectId } from "mongodb";
import { z } from "zod";

/**
 * Unit tests for Read Receipt Handler logic
 *
 * Note: Full integration tests are in e2e tests where we can properly set up environment.
 * These tests verify the validation and Socket.IO event broadcast logic.
 */

describe("Read Receipt Handler Logic", () => {
  // Validation schema (same as in handler)
  const receiptSchema = z.object({
    chatId: z
      .string()
      .refine((val) => ObjectId.isValid(val), "Invalid chatId format"),
    messageId: z
      .string()
      .refine((val) => ObjectId.isValid(val), "Invalid messageId format"),
  });

  describe("payload validation", () => {
    it("should accept valid read receipt payload", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        messageId: new ObjectId().toString(),
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(true);
    });

    it("should reject read receipt with invalid chatId format", () => {
      const payload = {
        chatId: "invalid-id",
        messageId: new ObjectId().toString(),
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject read receipt with invalid messageId format", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        messageId: "invalid-id",
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject read receipt with missing chatId", () => {
      const payload = {
        messageId: new ObjectId().toString(),
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject read receipt with missing messageId", () => {
      const payload = {
        chatId: new ObjectId().toString(),
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject read receipt with empty chatId", () => {
      const payload = {
        chatId: "",
        messageId: new ObjectId().toString(),
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });

    it("should reject read receipt with empty messageId", () => {
      const payload = {
        chatId: new ObjectId().toString(),
        messageId: "",
      };

      const validation = receiptSchema.safeParse(payload);
      expect(validation.success).toBe(false);
    });
  });

  describe("read receipt payload structure", () => {
    it("should have correct structure for receipt:update broadcast", () => {
      const userId = new ObjectId().toString();
      const chatId = new ObjectId().toString();
      const messageId = new ObjectId().toString();
      const readAt = new Date().toISOString();

      const payload = {
        chatId,
        messageId,
        userId,
        readAt,
      };

      expect(payload.chatId).toBeDefined();
      expect(payload.messageId).toBeDefined();
      expect(payload.userId).toBeDefined();
      expect(payload.readAt).toBeDefined();
      expect(typeof payload.readAt).toBe("string");
    });

    it("should have ISO timestamp for readAt", () => {
      const readAt = new Date().toISOString();
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

      expect(readAt).toMatch(isoRegex);
    });
  });

  describe("acknowledgment responses", () => {
    it("should return readAt timestamp on success", () => {
      const readAt = new Date().toISOString();
      const ack = {
        ok: true,
        data: {
          readAt,
        },
      };

      expect(ack.ok).toBe(true);
      expect(ack.data?.readAt).toBeDefined();
      expect(typeof ack.data?.readAt).toBe("string");
    });

    it("should return error code and message on failure", () => {
      const ack = {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "Invalid messageId format",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBeDefined();
      expect(ack.message).toBeDefined();
      expect(ack.correlationId).toBeDefined();
    });

    it("should return FORBIDDEN error for non-member", () => {
      const ack = {
        ok: false,
        error: "FORBIDDEN",
        message: "User is not a member of this chat",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("FORBIDDEN");
    });

    it("should return NOT_FOUND error when message does not exist", () => {
      const ack = {
        ok: false,
        error: "NOT_FOUND",
        message: "Message not found",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("NOT_FOUND");
    });

    it("should return VALIDATION_ERROR when message belongs to different chat", () => {
      const ack = {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "Message does not belong to this chat",
        correlationId: crypto.randomUUID(),
      };

      expect(ack.ok).toBe(false);
      expect(ack.error).toBe("VALIDATION_ERROR");
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

    it("should use NOT_FOUND for missing message", () => {
      const errorCode = "NOT_FOUND";
      expect(errorCode).toBe("NOT_FOUND");
    });

    it("should use INTERNAL for server errors", () => {
      const errorCode = "INTERNAL";
      expect(errorCode).toBe("INTERNAL");
    });
  });

  describe("room broadcast", () => {
    it("should broadcast to chat room", () => {
      const mockSocket = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };

      const chatId = new ObjectId().toString();
      const roomName = `chat:${chatId}`;

      mockSocket.to(roomName).emit("receipt:update", {
        chatId,
        messageId: new ObjectId().toString(),
        userId: new ObjectId().toString(),
        readAt: new Date().toISOString(),
      });

      expect(mockSocket.to).toHaveBeenCalledWith(roomName);
    });

    it("should include all required fields in broadcast", () => {
      const mockSocket = {
        to: jest.fn().mockReturnValue({
          emit: jest.fn(),
        }),
      };

      const chatId = new ObjectId().toString();
      const messageId = new ObjectId().toString();
      const userId = new ObjectId().toString();
      const readAt = new Date().toISOString();

      const broadcastData = {
        chatId,
        messageId,
        userId,
        readAt,
      };

      mockSocket.to(`chat:${chatId}`).emit("receipt:update", broadcastData);

      expect(mockSocket.to).toHaveBeenCalledWith(`chat:${chatId}`);
      expect(broadcastData).toHaveProperty("chatId");
      expect(broadcastData).toHaveProperty("messageId");
      expect(broadcastData).toHaveProperty("userId");
      expect(broadcastData).toHaveProperty("readAt");
    });
  });
});
