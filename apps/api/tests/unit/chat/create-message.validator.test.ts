import { ObjectId } from "mongodb";
import { z } from "zod";

// Extract and test the schema directly
const createMessageSchema = z.object({
  chatId: z
    .string()
    .min(1, "Chat ID is required")
    .refine((val) => ObjectId.isValid(val), "Chat ID must be a valid ObjectId"),
  clientId: z.string().optional(),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(8000, "Message body exceeds maximum length of 8000 characters"),
});

describe("Unit: createMessageSchema Validator", () => {
  const validChatId = new ObjectId().toString();

  describe("Valid inputs", () => {
    it("should accept valid message with all fields", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        clientId: "unique-123",
        body: "Hello world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.chatId).toBe(validChatId);
        expect(result.data.clientId).toBe("unique-123");
        expect(result.data.body).toBe("Hello world");
      }
    });

    it("should accept valid message without clientId", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "Hello world",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientId).toBeUndefined();
      }
    });

    it("should accept message with max length body (8000 chars)", () => {
      const longBody = "a".repeat(8000);
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: longBody,
      });

      expect(result.success).toBe(true);
    });

    it("should accept message with emoji", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "Hello 👋 world 🌍",
      });

      expect(result.success).toBe(true);
    });

    it("should accept message with whitespace", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "   ",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Invalid chatId", () => {
    it("should reject missing chatId", () => {
      const result = createMessageSchema.safeParse({
        body: "Hello world",
      });

      expect(result.success).toBe(false);
    });

    it("should reject invalid ObjectId format", () => {
      const result = createMessageSchema.safeParse({
        chatId: "not-an-object-id",
        body: "Hello world",
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty chatId string", () => {
      const result = createMessageSchema.safeParse({
        chatId: "",
        body: "Hello world",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("Invalid body", () => {
    it("should reject missing body", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
      });

      expect(result.success).toBe(false);
    });

    it("should reject empty body string", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "",
      });

      expect(result.success).toBe(false);
    });

    it("should reject body exceeding max length (8000 chars)", () => {
      const longBody = "a".repeat(8001);
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: longBody,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("clientId field", () => {
    it("should allow optional clientId", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "Hello",
        clientId: "optional-id",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientId).toBe("optional-id");
      }
    });

    it("should handle clientId with special characters", () => {
      const result = createMessageSchema.safeParse({
        chatId: validChatId,
        body: "Hello",
        clientId: "client-id-123-abc_xyz",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clientId).toBe("client-id-123-abc_xyz");
      }
    });
  });
});
