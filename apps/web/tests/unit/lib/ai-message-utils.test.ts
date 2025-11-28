import type { UIMessage } from "ai";
import {
  AI_SENDER_ID,
  isAIMessage,
  toMessageDTO,
  toMessageDTOs,
  toUIMessage,
  toUIMessages,
} from "@/lib/utils/ai-message-utils";
import type { MessageDTO } from "@/types/api.types";

describe("ai-message-utils", () => {
  describe("AI_SENDER_ID", () => {
    it("should be a constant string", () => {
      expect(AI_SENDER_ID).toBe("ai-assistant");
    });
  });

  describe("toUIMessage", () => {
    it("should convert user message to UIMessage", () => {
      const messageDTO: MessageDTO = {
        _id: "msg-1",
        chatId: "chat-1",
        senderId: "user-123",
        body: "Hello AI!",
        createdAt: "2024-01-01T10:00:00Z",
        deleted: false,
      };

      const result = toUIMessage(messageDTO);

      expect(result.id).toBe("msg-1");
      expect(result.role).toBe("user");
      expect(result.parts).toEqual([{ type: "text", text: "Hello AI!" }]);
      expect(result.metadata).toEqual({ createdAt: "2024-01-01T10:00:00Z" });
    });

    it("should convert AI message to UIMessage with assistant role", () => {
      const messageDTO: MessageDTO = {
        _id: "msg-2",
        chatId: "chat-1",
        senderId: AI_SENDER_ID,
        body: "Hello! How can I help?",
        createdAt: "2024-01-01T10:00:01Z",
        deleted: false,
      };

      const result = toUIMessage(messageDTO);

      expect(result.id).toBe("msg-2");
      expect(result.role).toBe("assistant");
      expect(result.parts).toEqual([
        { type: "text", text: "Hello! How can I help?" },
      ]);
    });
  });

  describe("toUIMessages", () => {
    it("should convert array of MessageDTO to UIMessage array", () => {
      const messages: MessageDTO[] = [
        {
          _id: "msg-1",
          chatId: "chat-1",
          senderId: "user-123",
          body: "Hello",
          createdAt: "2024-01-01T10:00:00Z",
          deleted: false,
        },
        {
          _id: "msg-2",
          chatId: "chat-1",
          senderId: AI_SENDER_ID,
          body: "Hi there!",
          createdAt: "2024-01-01T10:00:01Z",
          deleted: false,
        },
      ];

      const result = toUIMessages(messages);

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("user");
      expect(result[1].role).toBe("assistant");
    });

    it("should sort messages by createdAt ascending", () => {
      const messages: MessageDTO[] = [
        {
          _id: "msg-2",
          chatId: "chat-1",
          senderId: AI_SENDER_ID,
          body: "Second",
          createdAt: "2024-01-01T10:00:01Z",
          deleted: false,
        },
        {
          _id: "msg-1",
          chatId: "chat-1",
          senderId: "user-123",
          body: "First",
          createdAt: "2024-01-01T10:00:00Z",
          deleted: false,
        },
      ];

      const result = toUIMessages(messages);

      expect(result[0].id).toBe("msg-1");
      expect(result[1].id).toBe("msg-2");
    });

    it("should return empty array for empty input", () => {
      const result = toUIMessages([]);
      expect(result).toEqual([]);
    });
  });

  describe("toMessageDTO", () => {
    it("should convert user UIMessage to MessageDTO", () => {
      const uiMessage: UIMessage<{ createdAt: string }> = {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello AI!" }],
        metadata: { createdAt: "2024-01-01T10:00:00Z" },
      };

      const result = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(result._id).toBe("msg-1");
      expect(result.chatId).toBe("chat-1");
      expect(result.senderId).toBe("user-123");
      expect(result.body).toBe("Hello AI!");
      expect(result.createdAt).toBe("2024-01-01T10:00:00Z");
      expect(result.deleted).toBe(false);
    });

    it("should convert assistant UIMessage to MessageDTO with AI_SENDER_ID", () => {
      const uiMessage: UIMessage<{ createdAt: string }> = {
        id: "msg-2",
        role: "assistant",
        parts: [{ type: "text", text: "Hello! How can I help?" }],
        metadata: { createdAt: "2024-01-01T10:00:01Z" },
      };

      const result = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(result.senderId).toBe(AI_SENDER_ID);
    });

    it("should concatenate multiple text parts", () => {
      const uiMessage: UIMessage<{ createdAt: string }> = {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "text", text: "Part 1. " },
          { type: "text", text: "Part 2." },
        ],
        metadata: { createdAt: "2024-01-01T10:00:00Z" },
      };

      const result = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(result.body).toBe("Part 1. Part 2.");
    });

    it("should use current timestamp when metadata.createdAt is missing", () => {
      const beforeTest = new Date().toISOString();

      const uiMessage: UIMessage<{ createdAt?: string }> = {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      };

      const result = toMessageDTO(uiMessage, "chat-1", "user-123");

      const afterTest = new Date().toISOString();
      expect(result.createdAt >= beforeTest).toBe(true);
      expect(result.createdAt <= afterTest).toBe(true);
    });

    it("should filter out non-text parts", () => {
      const uiMessage: UIMessage<{ createdAt: string }> = {
        id: "msg-1",
        role: "assistant",
        parts: [
          { type: "text", text: "Hello" },
          { type: "step-start" },
          { type: "text", text: " World" },
          // biome-ignore lint: testing non-text parts
        ] as any,
        metadata: { createdAt: "2024-01-01T10:00:00Z" },
      };

      const result = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(result.body).toBe("Hello World");
    });
  });

  describe("toMessageDTOs", () => {
    it("should convert array of UIMessage to MessageDTO array", () => {
      const uiMessages: UIMessage<{ createdAt: string }>[] = [
        {
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
          metadata: { createdAt: "2024-01-01T10:00:00Z" },
        },
        {
          id: "msg-2",
          role: "assistant",
          parts: [{ type: "text", text: "Hi!" }],
          metadata: { createdAt: "2024-01-01T10:00:01Z" },
        },
      ];

      const result = toMessageDTOs(uiMessages, "chat-1", "user-123");

      expect(result).toHaveLength(2);
      expect(result[0].senderId).toBe("user-123");
      expect(result[1].senderId).toBe(AI_SENDER_ID);
    });

    it("should return empty array for empty input", () => {
      const result = toMessageDTOs([], "chat-1", "user-123");
      expect(result).toEqual([]);
    });
  });

  describe("isAIMessage", () => {
    it("should return true for AI messages", () => {
      const message: MessageDTO = {
        _id: "msg-1",
        chatId: "chat-1",
        senderId: AI_SENDER_ID,
        body: "AI response",
        createdAt: "2024-01-01T10:00:00Z",
        deleted: false,
      };

      expect(isAIMessage(message)).toBe(true);
    });

    it("should return false for user messages", () => {
      const message: MessageDTO = {
        _id: "msg-1",
        chatId: "chat-1",
        senderId: "user-123",
        body: "User message",
        createdAt: "2024-01-01T10:00:00Z",
        deleted: false,
      };

      expect(isAIMessage(message)).toBe(false);
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve data through MessageDTO -> UIMessage -> MessageDTO", () => {
      const original: MessageDTO = {
        _id: "msg-1",
        chatId: "chat-1",
        senderId: "user-123",
        body: "Hello AI!",
        createdAt: "2024-01-01T10:00:00Z",
        deleted: false,
      };

      const uiMessage = toUIMessage(original);
      const converted = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(converted._id).toBe(original._id);
      expect(converted.body).toBe(original.body);
      expect(converted.createdAt).toBe(original.createdAt);
      expect(converted.senderId).toBe(original.senderId);
    });

    it("should preserve AI sender through round-trip", () => {
      const original: MessageDTO = {
        _id: "msg-1",
        chatId: "chat-1",
        senderId: AI_SENDER_ID,
        body: "AI response",
        createdAt: "2024-01-01T10:00:00Z",
        deleted: false,
      };

      const uiMessage = toUIMessage(original);
      const converted = toMessageDTO(uiMessage, "chat-1", "user-123");

      expect(converted.senderId).toBe(AI_SENDER_ID);
    });
  });
});
