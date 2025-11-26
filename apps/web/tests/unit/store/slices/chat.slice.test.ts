import { configureStore } from "@reduxjs/toolkit";
import chatReducer, {
  addMessageFromEvent,
  clearError,
  createChat,
  fetchChats,
  fetchMessages,
  markMessagesAsRead,
  resetUnreadCount,
  selectActiveChat,
  selectActiveChatId,
  selectChatById,
  selectChatError,
  selectChatLoading,
  selectChats,
  selectMessagesForChat,
  sendMessage,
  setActiveChat,
  updateChatFromEvent,
} from "@/store/slices/chat.slice";
import type { RootState } from "@/store/store";
import type {
  ChatDTO,
  ChatWithPreviewDTO,
  MessageDTO,
} from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getChats: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  createChat: jest.fn(),
  updateReadCursor: jest.fn(),
}));

import {
  createChat as apiCreateChat,
  sendMessage as apiSendMessage,
  getChats,
  getMessages,
  updateReadCursor,
} from "@/lib/api-client";

const mockedGetChats = getChats as jest.MockedFunction<typeof getChats>;
const mockedGetMessages = getMessages as jest.MockedFunction<
  typeof getMessages
>;
const mockedSendMessage = apiSendMessage as jest.MockedFunction<
  typeof apiSendMessage
>;
const mockedCreateChat = apiCreateChat as jest.MockedFunction<
  typeof apiCreateChat
>;
const mockedUpdateReadCursor = updateReadCursor as jest.MockedFunction<
  typeof updateReadCursor
>;

interface TestRootState {
  chat: ReturnType<typeof chatReducer>;
}

describe("chat.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const mockChat1: ChatWithPreviewDTO = {
    _id: "chat-1",
    type: "dm",
    title: null,
    createdBy: "user-1",
    memberIds: ["user-1", "user-2"],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    unreadCount: 2,
    lastMessage: {
      _id: "msg-1",
      senderId: "user-2",
      body: "Hello!",
      createdAt: "2024-01-01T10:00:00Z",
    },
  };

  const mockChat2: ChatWithPreviewDTO = {
    _id: "chat-2",
    type: "group",
    title: "Family Group",
    createdBy: "user-1",
    memberIds: ["user-1", "user-2", "user-3"],
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    unreadCount: 0,
  };

  const mockMessage1: MessageDTO = {
    _id: "msg-1",
    chatId: "chat-1",
    senderId: "user-2",
    body: "Hello!",
    createdAt: "2024-01-01T10:00:00Z",
    deleted: false,
  };

  const mockMessage2: MessageDTO = {
    _id: "msg-2",
    chatId: "chat-1",
    senderId: "user-1",
    body: "Hi there!",
    createdAt: "2024-01-01T10:01:00Z",
    deleted: false,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        chat: chatReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().chat;
      expect(state.chats).toEqual([]);
      expect(state.messages).toEqual({});
      expect(state.activeChatId).toBeNull();
      expect(state.loading.chats).toBe(false);
      expect(state.loading.messages).toBe(false);
      expect(state.loading.sending).toBe(false);
      expect(state.loading.loadingMore).toBe(false);
      expect(state.error.chats).toBeNull();
      expect(state.error.messages).toBeNull();
      expect(state.error.sending).toBeNull();
      expect(state.lastFetch).toBeNull();
    });
  });

  describe("clearError action", () => {
    it("should clear specific error", () => {
      // First, trigger an error
      mockedGetChats.mockRejectedValueOnce(new Error("Test error"));
      store.dispatch(fetchChats({}));

      // Wait for the rejection
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          store.dispatch(clearError("chats"));
          expect(store.getState().chat.error.chats).toBeNull();
          resolve();
        }, 10);
      });
    });
  });

  describe("setActiveChat action", () => {
    it("should set active chat ID", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });
      await store.dispatch(fetchChats({}));

      store.dispatch(setActiveChat("chat-1"));
      const state = store.getState().chat;

      expect(state.activeChatId).toBe("chat-1");
    });

    it("should reset unread count when setting active chat", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      expect(store.getState().chat.chats[0].unreadCount).toBe(2);

      store.dispatch(setActiveChat("chat-1"));
      expect(store.getState().chat.chats[0].unreadCount).toBe(0);
    });

    it("should handle null active chat", () => {
      store.dispatch(setActiveChat(null));
      expect(store.getState().chat.activeChatId).toBeNull();
    });
  });

  describe("resetUnreadCount action", () => {
    it("should reset unread count for specific chat", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      expect(store.getState().chat.chats[0].unreadCount).toBe(2);

      store.dispatch(resetUnreadCount("chat-1"));
      expect(store.getState().chat.chats[0].unreadCount).toBe(0);
    });

    it("should not affect other chats", async () => {
      const chat2WithUnread = { ...mockChat2, unreadCount: 5 };
      mockedGetChats.mockResolvedValueOnce({
        chats: [mockChat1, chat2WithUnread],
      });
      await store.dispatch(fetchChats({}));

      store.dispatch(resetUnreadCount("chat-1"));

      expect(store.getState().chat.chats[0].unreadCount).toBe(0);
      expect(store.getState().chat.chats[1].unreadCount).toBe(5);
    });
  });

  describe("addMessageFromEvent action", () => {
    it("should add message to existing chat", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const newMessage: MessageDTO = {
        _id: "msg-new",
        chatId: "chat-1",
        senderId: "user-2",
        body: "New message!",
        createdAt: "2024-01-01T11:00:00Z",
        deleted: false,
      };

      store.dispatch(addMessageFromEvent(newMessage));

      const messages = store.getState().chat.messages["chat-1"];
      expect(messages).toContainEqual(newMessage);
    });

    it("should create message array if not exists", () => {
      const newMessage: MessageDTO = {
        _id: "msg-new",
        chatId: "chat-new",
        senderId: "user-2",
        body: "New message!",
        createdAt: "2024-01-01T11:00:00Z",
        deleted: false,
      };

      store.dispatch(addMessageFromEvent(newMessage));

      const messages = store.getState().chat.messages["chat-new"];
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(newMessage);
    });

    it("should not add duplicate messages", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      store.dispatch(addMessageFromEvent(mockMessage1));
      store.dispatch(addMessageFromEvent(mockMessage1));

      const messages = store.getState().chat.messages["chat-1"];
      const count = messages.filter((m) => m._id === mockMessage1._id).length;
      expect(count).toBe(1);
    });

    it("should update chat preview with new message", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const newMessage: MessageDTO = {
        _id: "msg-new",
        chatId: "chat-1",
        senderId: "user-2",
        body: "Updated preview message",
        createdAt: "2024-01-01T12:00:00Z",
        deleted: false,
      };

      store.dispatch(addMessageFromEvent(newMessage));

      const chat = store.getState().chat.chats.find((c) => c._id === "chat-1");
      expect(chat?.lastMessage?.body).toBe("Updated preview message");
    });

    it("should increment unread count if not active chat", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });
      await store.dispatch(fetchChats({}));
      store.dispatch(setActiveChat("chat-2"));

      const newMessage: MessageDTO = {
        _id: "msg-new",
        chatId: "chat-1",
        senderId: "user-2",
        body: "New message!",
        createdAt: "2024-01-01T11:00:00Z",
        deleted: false,
      };

      const initialUnread = store
        .getState()
        .chat.chats.find((c) => c._id === "chat-1")?.unreadCount;

      store.dispatch(addMessageFromEvent(newMessage));

      const finalUnread = store
        .getState()
        .chat.chats.find((c) => c._id === "chat-1")?.unreadCount;

      expect(finalUnread).toBe((initialUnread || 0) + 1);
    });

    it("should move chat to top of list", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });
      await store.dispatch(fetchChats({}));

      expect(store.getState().chat.chats[0]._id).toBe("chat-1");

      const newMessage: MessageDTO = {
        _id: "msg-new",
        chatId: "chat-2",
        senderId: "user-3",
        body: "New message in chat 2!",
        createdAt: "2024-01-01T11:00:00Z",
        deleted: false,
      };

      store.dispatch(addMessageFromEvent(newMessage));

      expect(store.getState().chat.chats[0]._id).toBe("chat-2");
    });
  });

  describe("updateChatFromEvent action", () => {
    it("should update existing chat", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const updatedChat: ChatDTO = {
        ...mockChat1,
        title: "Updated Title",
      };

      store.dispatch(updateChatFromEvent(updatedChat));

      const chat = store.getState().chat.chats.find((c) => c._id === "chat-1");
      expect(chat?.title).toBe("Updated Title");
    });

    it("should add new chat if not exists", () => {
      const newChat: ChatDTO = {
        _id: "chat-new",
        type: "dm",
        title: null,
        createdBy: "user-1",
        memberIds: ["user-1", "user-3"],
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z",
      };

      store.dispatch(updateChatFromEvent(newChat));

      const chat = store
        .getState()
        .chat.chats.find((c) => c._id === "chat-new");
      expect(chat).toBeDefined();
      expect(chat?.unreadCount).toBe(0);
    });

    it("should preserve unreadCount and lastMessage when updating", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const updatedChat: ChatDTO = {
        ...mockChat1,
        title: "Updated Title",
      };

      store.dispatch(updateChatFromEvent(updatedChat));

      const chat = store.getState().chat.chats.find((c) => c._id === "chat-1");
      expect(chat?.unreadCount).toBe(mockChat1.unreadCount);
      expect(chat?.lastMessage).toEqual(mockChat1.lastMessage);
    });

    it("should not create duplicate chat entries when updating same id", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      store.dispatch(updateChatFromEvent({ ...mockChat1, title: "Title A" }));
      store.dispatch(updateChatFromEvent({ ...mockChat1, title: "Title B" }));

      const chats = store.getState().chat.chats;
      expect(chats).toHaveLength(1);
      expect(chats[0].title).toBe("Title B");
    });
  });

  describe("fetchChats async thunk", () => {
    it("should set loading state when pending", () => {
      mockedGetChats.mockImplementation(() => new Promise(() => {}));
      store.dispatch(fetchChats({}));
      const state = store.getState().chat;

      expect(state.loading.chats).toBe(true);
      expect(state.error.chats).toBeNull();
    });

    it("should set chats when fulfilled", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });

      await store.dispatch(fetchChats({}));
      const state = store.getState().chat;

      expect(state.loading.chats).toBe(false);
      expect(state.chats).toEqual([mockChat1, mockChat2]);
      expect(state.error.chats).toBeNull();
      expect(state.lastFetch).toBeTruthy();
    });

    it("should pass cursor and limit to API", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [] });

      await store.dispatch(fetchChats({ cursor: "abc", limit: 20 }));

      expect(mockedGetChats).toHaveBeenCalledWith("abc", 20);
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch chats";
      mockedGetChats.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchChats({}));
      const state = store.getState().chat;

      expect(state.loading.chats).toBe(false);
      expect(state.error.chats).toBe(errorMessage);
    });
  });

  describe("fetchMessages async thunk", () => {
    it("should set loading state when pending", () => {
      mockedGetMessages.mockImplementation(() => new Promise(() => {}));
      store.dispatch(fetchMessages({ chatId: "chat-1" }));
      const state = store.getState().chat;

      expect(state.loading.messages).toBe(true);
      expect(state.error.messages).toBeNull();
    });

    it("should set messages when fulfilled", async () => {
      mockedGetMessages.mockResolvedValueOnce({
        messages: [mockMessage1, mockMessage2],
      });

      await store.dispatch(fetchMessages({ chatId: "chat-1" }));
      const state = store.getState().chat;

      expect(state.loading.messages).toBe(false);
      // Messages are reversed (API returns newest first, we want oldest first)
      expect(state.messages["chat-1"]).toEqual([mockMessage2, mockMessage1]);
      expect(state.error.messages).toBeNull();
    });

    it("should pass before and limit to API", async () => {
      mockedGetMessages.mockResolvedValueOnce({ messages: [] });

      await store.dispatch(
        fetchMessages({ chatId: "chat-1", before: "msg-5", limit: 25 }),
      );

      expect(mockedGetMessages).toHaveBeenCalledWith("chat-1", "msg-5", 25);
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch messages";
      mockedGetMessages.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchMessages({ chatId: "chat-1" }));
      const state = store.getState().chat;

      expect(state.loading.messages).toBe(false);
      expect(state.error.messages).toBe(errorMessage);
    });
  });

  describe("sendMessage async thunk", () => {
    it("should set loading state when pending", () => {
      mockedSendMessage.mockImplementation(() => new Promise(() => {}));
      store.dispatch(sendMessage({ chatId: "chat-1", body: "Test" }));
      const state = store.getState().chat;

      expect(state.loading.sending).toBe(true);
      expect(state.error.sending).toBeNull();
    });

    it("should add message when fulfilled", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const sentMessage: MessageDTO = {
        _id: "msg-sent",
        chatId: "chat-1",
        senderId: "user-1",
        body: "Sent message",
        createdAt: "2024-01-01T12:00:00Z",
        deleted: false,
      };
      mockedSendMessage.mockResolvedValueOnce(sentMessage);

      await store.dispatch(
        sendMessage({ chatId: "chat-1", body: "Sent message" }),
      );
      const state = store.getState().chat;

      expect(state.loading.sending).toBe(false);
      expect(state.messages["chat-1"]).toContainEqual(sentMessage);
      expect(state.error.sending).toBeNull();
    });

    it("should update chat preview after sending", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const sentMessage: MessageDTO = {
        _id: "msg-sent",
        chatId: "chat-1",
        senderId: "user-1",
        body: "New preview text",
        createdAt: "2024-01-01T12:00:00Z",
        deleted: false,
      };
      mockedSendMessage.mockResolvedValueOnce(sentMessage);

      await store.dispatch(
        sendMessage({ chatId: "chat-1", body: "New preview text" }),
      );

      const chat = store.getState().chat.chats.find((c) => c._id === "chat-1");
      expect(chat?.lastMessage?.body).toBe("New preview text");
    });

    it("should move chat to top after sending", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });
      await store.dispatch(fetchChats({}));

      const sentMessage: MessageDTO = {
        _id: "msg-sent",
        chatId: "chat-2",
        senderId: "user-1",
        body: "Message to chat 2",
        createdAt: "2024-01-01T12:00:00Z",
        deleted: false,
      };
      mockedSendMessage.mockResolvedValueOnce(sentMessage);

      await store.dispatch(
        sendMessage({ chatId: "chat-2", body: "Message to chat 2" }),
      );

      expect(store.getState().chat.chats[0]._id).toBe("chat-2");
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to send message";
      mockedSendMessage.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(sendMessage({ chatId: "chat-1", body: "Test" }));
      const state = store.getState().chat;

      expect(state.loading.sending).toBe(false);
      expect(state.error.sending).toBeTruthy();
    });

    it("should generate clientId if not provided", async () => {
      mockedSendMessage.mockResolvedValueOnce(mockMessage1);

      await store.dispatch(sendMessage({ chatId: "chat-1", body: "Test" }));

      expect(mockedSendMessage).toHaveBeenCalledWith(
        "chat-1",
        expect.objectContaining({
          body: "Test",
          clientId: expect.any(String),
        }),
      );
    });
  });

  describe("createChat async thunk", () => {
    it("should add new chat when fulfilled", async () => {
      const newChat: ChatDTO = {
        _id: "chat-new",
        type: "dm",
        title: null,
        createdBy: "user-1",
        memberIds: ["user-1", "user-3"],
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z",
      };
      mockedCreateChat.mockResolvedValueOnce(newChat);

      await store.dispatch(createChat({ type: "dm", memberIds: ["user-3"] }));
      const state = store.getState().chat;

      expect(state.chats[0]._id).toBe("chat-new");
      expect(state.chats[0].unreadCount).toBe(0);
    });

    it("should not duplicate an existing chat id", async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1] });
      await store.dispatch(fetchChats({}));

      const duplicateChat: ChatDTO = {
        ...mockChat1,
        title: "Updated from duplicate create",
      };
      mockedCreateChat.mockResolvedValueOnce(duplicateChat);

      await store.dispatch(createChat({ type: "dm", memberIds: ["user-2"] }));

      const chats = store.getState().chat.chats;
      expect(chats).toHaveLength(1);
      expect(chats[0].title).toBe(duplicateChat.title);
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to create chat";
      mockedCreateChat.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(createChat({ type: "dm", memberIds: ["user-3"] }));
      const state = store.getState().chat;

      expect(state.error.chats).toBe(errorMessage);
    });
  });

  describe("markMessagesAsRead async thunk", () => {
    it("should call updateReadCursor API", async () => {
      mockedUpdateReadCursor.mockResolvedValueOnce(undefined);

      await store.dispatch(
        markMessagesAsRead({ chatId: "chat-1", messageId: "msg-1" }),
      );

      expect(mockedUpdateReadCursor).toHaveBeenCalledWith("chat-1", "msg-1");
    });

    it("should handle API errors gracefully", async () => {
      mockedUpdateReadCursor.mockRejectedValueOnce(new Error("API Error"));

      const result = await store.dispatch(
        markMessagesAsRead({ chatId: "chat-1", messageId: "msg-1" }),
      );

      // Should reject but not crash
      expect(result.meta.requestStatus).toBe("rejected");
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      mockedGetChats.mockResolvedValueOnce({ chats: [mockChat1, mockChat2] });
      await store.dispatch(fetchChats({}));
    });

    describe("selectChats", () => {
      it("should return all chats", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectChats(state)).toEqual([mockChat1, mockChat2]);
      });
    });

    describe("selectActiveChatId", () => {
      it("should return null when no chat selected", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectActiveChatId(state)).toBeNull();
      });

      it("should return active chat ID when set", () => {
        store.dispatch(setActiveChat("chat-1"));
        const state = store.getState() as unknown as RootState;
        expect(selectActiveChatId(state)).toBe("chat-1");
      });
    });

    describe("selectActiveChat", () => {
      it("should return null when no chat selected", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectActiveChat(state)).toBeNull();
      });

      it("should return active chat when set", () => {
        store.dispatch(setActiveChat("chat-1"));
        const state = store.getState() as unknown as RootState;
        expect(selectActiveChat(state)).toEqual(
          expect.objectContaining({ _id: "chat-1" }),
        );
      });
    });

    describe("selectChatLoading", () => {
      it("should return loading states", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectChatLoading(state)).toEqual({
          chats: false,
          messages: false,
          sending: false,
          loadingMore: false,
        });
      });
    });

    describe("selectChatError", () => {
      it("should return error states", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectChatError(state)).toEqual({
          chats: null,
          messages: null,
          sending: null,
        });
      });
    });

    describe("selectMessagesForChat", () => {
      it("should return empty array for chat without messages", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectMessagesForChat(state, "chat-1")).toEqual([]);
      });

      it("should return stable empty array reference", () => {
        const state = store.getState() as unknown as RootState;
        const first = selectMessagesForChat(state, "chat-unknown");
        const second = selectMessagesForChat(state, "chat-unknown");
        expect(second).toBe(first);
      });

      it("should return messages for chat", async () => {
        mockedGetMessages.mockResolvedValueOnce({
          messages: [mockMessage1, mockMessage2],
        });
        await store.dispatch(fetchMessages({ chatId: "chat-1" }));

        const state = store.getState() as unknown as RootState;
        expect(selectMessagesForChat(state, "chat-1")).toHaveLength(2);
      });
    });

    describe("selectChatById", () => {
      it("should return chat when found", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectChatById(state, "chat-1")?._id).toBe("chat-1");
      });

      it("should return undefined when not found", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectChatById(state, "non-existent")).toBeUndefined();
      });
    });
  });
});
