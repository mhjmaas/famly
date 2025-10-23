import { ObjectId } from "mongodb";
import { toMessageDTO } from "@modules/chat/lib/message.mapper";
import type { Message } from "@modules/chat/domain/message";

describe("Message Mapper", () => {
  describe("toMessageDTO", () => {
    it("should convert Message entity to MessageDTO with all fields", () => {
      const messageId = new ObjectId();
      const chatId = new ObjectId();
      const senderId = new ObjectId();
      const now = new Date();

      const message: Message = {
        _id: messageId,
        chatId,
        senderId,
        body: "Hello everyone!",
        clientId: "msg-123",
        createdAt: now,
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto._id).toBe(messageId.toString());
      expect(dto.chatId).toBe(chatId.toString());
      expect(dto.senderId).toBe(senderId.toString());
      expect(dto.body).toBe("Hello everyone!");
      expect(dto.clientId).toBe("msg-123");
      expect(dto.deleted).toBe(false);
      expect(dto.createdAt).toBe(now.toISOString());
    });

    it("should include optional editedAt field when present", () => {
      const now = new Date();
      const editedAt = new Date("2025-01-15T11:00:00.000Z");

      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "Edited message",
        createdAt: now,
        editedAt,
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.editedAt).toBe(editedAt.toISOString());
    });

    it("should not include optional editedAt field when undefined", () => {
      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "Unedited message",
        createdAt: new Date(),
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.editedAt).toBeUndefined();
    });

    it("should include optional clientId field when present", () => {
      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "Message with client ID",
        clientId: "client-456",
        createdAt: new Date(),
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.clientId).toBe("client-456");
    });

    it("should not include optional clientId field when undefined", () => {
      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "Message without client ID",
        createdAt: new Date(),
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.clientId).toBeUndefined();
    });

    it("should convert all ObjectIds to strings", () => {
      const messageId = new ObjectId();
      const chatId = new ObjectId();
      const senderId = new ObjectId();

      const message: Message = {
        _id: messageId,
        chatId,
        senderId,
        body: "Test",
        createdAt: new Date(),
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(typeof dto._id).toBe("string");
      expect(typeof dto.chatId).toBe("string");
      expect(typeof dto.senderId).toBe("string");
    });

    it("should convert Date objects to ISO8601 strings", () => {
      const createdAt = new Date("2025-01-15T10:30:00.000Z");
      const editedAt = new Date("2025-01-15T11:00:00.000Z");

      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "Test message",
        createdAt,
        editedAt,
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.editedAt).toBe("2025-01-15T11:00:00.000Z");
    });

    it("should handle deleted messages", () => {
      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: "This message was deleted",
        createdAt: new Date(),
        deleted: true,
      };

      const dto = toMessageDTO(message);

      expect(dto.deleted).toBe(true);
    });

    it("should handle long message bodies", () => {
      const longBody = "x".repeat(8000);

      const message: Message = {
        _id: new ObjectId(),
        chatId: new ObjectId(),
        senderId: new ObjectId(),
        body: longBody,
        createdAt: new Date(),
        deleted: false,
      };

      const dto = toMessageDTO(message);

      expect(dto.body).toBe(longBody);
      expect(dto.body.length).toBe(8000);
    });
  });
});
