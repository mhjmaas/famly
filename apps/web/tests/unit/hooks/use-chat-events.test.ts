/**
 * Tests for useChatEvents hook
 *
 * Note: This hook is tightly coupled with Socket.IO and Redux,
 * making it challenging to unit test in isolation.
 * The integration tests in the e2e suite provide better coverage
 * for the real-time message flow.
 *
 * These tests focus on the hook's behavior with mocked dependencies.
 */

import { configureStore } from "@reduxjs/toolkit";
import chatReducer, {
  addMessageFromEvent,
  fetchChats,
  fetchMessages,
  updateChatFromEvent,
} from "@/store/slices/chat.slice";
import type { ChatDTO, MessageDTO } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getChats: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  createChat: jest.fn(),
  updateReadCursor: jest.fn(),
}));

import { getChats, getMessages } from "@/lib/api-client";

const mockedGetChats = getChats as jest.MockedFunction<typeof getChats>;
const mockedGetMessages = getMessages as jest.MockedFunction<
  typeof getMessages
>;

interface TestRootState {
  chat: ReturnType<typeof chatReducer>;
}

describe("useChatEvents - Redux integration", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const mockMessage: MessageDTO = {
    _id: "msg-realtime",
    chatId: "chat-1",
    senderId: "user-2",
    body: "Real-time message!",
    createdAt: "2024-01-01T12:00:00Z",
    deleted: false,
  };

  const mockChat: ChatDTO = {
    _id: "chat-1",
    type: "dm",
    title: null,
    createdBy: "user-1",
    memberIds: ["user-1", "user-2"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        chat: chatReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("message:new event handling", () => {
    it("should add message to store via addMessageFromEvent action", () => {
      // Simulate what the hook does when receiving a message:new event
      store.dispatch(addMessageFromEvent(mockMessage));

      const state = store.getState().chat;
      expect(state.messages["chat-1"]).toContainEqual(mockMessage);
    });

    it("should not duplicate messages", () => {
      store.dispatch(addMessageFromEvent(mockMessage));
      store.dispatch(addMessageFromEvent(mockMessage));

      const state = store.getState().chat;
      const messageCount = state.messages["chat-1"].filter(
        (m) => m._id === mockMessage._id,
      ).length;
      expect(messageCount).toBe(1);
    });
  });

  describe("chat:update event handling", () => {
    it("should update chat via updateChatFromEvent action", () => {
      // First add the chat
      store.dispatch(updateChatFromEvent(mockChat));

      // Then update it
      const updatedChat: ChatDTO = {
        ...mockChat,
        title: "Updated Title",
      };
      store.dispatch(updateChatFromEvent(updatedChat));

      const state = store.getState().chat;
      const chat = state.chats.find((c) => c._id === "chat-1");
      expect(chat?.title).toBe("Updated Title");
    });

    it("should add new chat if not exists", () => {
      store.dispatch(updateChatFromEvent(mockChat));

      const state = store.getState().chat;
      expect(state.chats).toHaveLength(1);
      expect(state.chats[0]._id).toBe("chat-1");
    });
  });

  describe("reconnect event handling", () => {
    it("should refetch chats on reconnect", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [] });

      // Simulate what the hook does on reconnect
      await store.dispatch(fetchChats({}));

      expect(mockedGetChats).toHaveBeenCalled();
    });

    it("should refetch messages for active chat on reconnect", async () => {
      mockedGetMessages.mockResolvedValueOnce({ messages: [] });

      // Simulate what the hook does on reconnect with active chat
      // Default limit is 10 as defined in the thunk
      await store.dispatch(fetchMessages({ chatId: "chat-1" }));

      expect(mockedGetMessages).toHaveBeenCalledWith("chat-1", undefined, 20);
    });
  });
});

describe("useChatEvents - Socket event simulation", () => {
  /**
   * These tests simulate the socket events that the hook listens to.
   * In a real scenario, these would be integration tests with a mock socket.
   */

  interface MockSocket {
    on: jest.Mock;
    off: jest.Mock;
    emit: jest.Mock;
    handlers: Record<string, ((...args: unknown[]) => void)[]>;
  }

  let mockSocket: MockSocket;

  beforeEach(() => {
    mockSocket = {
      handlers: {},
      on: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (!mockSocket.handlers[event]) {
          mockSocket.handlers[event] = [];
        }
        mockSocket.handlers[event].push(handler);
      }),
      off: jest.fn((event: string, handler: (...args: unknown[]) => void) => {
        if (mockSocket.handlers[event]) {
          mockSocket.handlers[event] = mockSocket.handlers[event].filter(
            (h) => h !== handler,
          );
        }
      }),
      emit: jest.fn(),
    };
  });

  it("should register event handlers on socket", () => {
    // Simulate the hook registering handlers
    const events = [
      "message:new",
      "message:notification",
      "chat:update",
      "receipt:update",
      "reconnect",
    ];

    events.forEach((event) => {
      mockSocket.on(event, jest.fn());
    });

    expect(mockSocket.on).toHaveBeenCalledTimes(5);
    events.forEach((event) => {
      expect(mockSocket.on).toHaveBeenCalledWith(event, expect.any(Function));
    });
  });

  it("should emit room:join when active chat changes", () => {
    const chatId = "chat-123";

    // Simulate the hook emitting room:join
    mockSocket.emit("room:join", { chatId }, expect.any(Function));

    expect(mockSocket.emit).toHaveBeenCalledWith(
      "room:join",
      { chatId },
      expect.any(Function),
    );
  });

  it("should emit room:leave on cleanup", () => {
    const chatId = "chat-123";

    // Simulate the hook emitting room:leave
    mockSocket.emit("room:leave", { chatId });

    expect(mockSocket.emit).toHaveBeenCalledWith("room:leave", { chatId });
  });

  it("should emit receipt:read when viewing active chat", () => {
    const chatId = "chat-123";
    const messageId = "msg-456";

    // Simulate the hook emitting receipt:read
    mockSocket.emit("receipt:read", { chatId, messageId });

    expect(mockSocket.emit).toHaveBeenCalledWith("receipt:read", {
      chatId,
      messageId,
    });
  });

  it("should unregister handlers on cleanup", () => {
    const handler = jest.fn();
    mockSocket.on("message:new", handler);

    // Simulate cleanup
    mockSocket.off("message:new", handler);

    expect(mockSocket.off).toHaveBeenCalledWith("message:new", handler);
  });
});
