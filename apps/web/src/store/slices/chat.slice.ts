import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  createChat as apiCreateChat,
  sendMessage as apiSendMessage,
  updateReadCursor as apiUpdateReadCursor,
  getChats,
  getMessages,
} from "@/lib/api-client";
import type {
  ChatDTO,
  ChatWithPreviewDTO,
  CreateChatRequest,
  CreateMessageRequest,
  MessageDTO,
} from "@/types/api.types";
import type { RootState } from "../store";

/**
 * Chat state structure
 * - chats: Array of chats with preview information
 * - messages: Map of chatId to array of messages
 * - activeChatId: Currently selected chat ID
 * - loading: Loading states for different operations
 * - error: Error states for different operations
 * - messageCursors: Map of chatId to nextCursor for pagination
 */
interface ChatState {
  chats: ChatWithPreviewDTO[];
  messages: Record<string, MessageDTO[]>;
  activeChatId: string | null;
  loading: {
    chats: boolean;
    messages: boolean;
    sending: boolean;
    loadingMore: boolean;
  };
  error: {
    chats: string | null;
    messages: string | null;
    sending: string | null;
  };
  lastFetch: number | null;
  messageCursors: Record<string, string | null>;
}

const initialState: ChatState = {
  chats: [],
  messages: {},
  activeChatId: null,
  loading: {
    chats: false,
    messages: false,
    sending: false,
    loadingMore: false,
  },
  error: {
    chats: null,
    messages: null,
    sending: null,
  },
  lastFetch: null,
  messageCursors: {},
};

const EMPTY_MESSAGES: MessageDTO[] = [];

const upsertChat = (
  state: ChatState,
  chat: ChatWithPreviewDTO,
  { preserve }: { preserve?: Partial<ChatWithPreviewDTO> } = {},
) => {
  const existingIndex = state.chats.findIndex((c) => c._id === chat._id);
  const mergedChat: ChatWithPreviewDTO = {
    ...chat,
    ...preserve,
  };

  if (existingIndex !== -1) {
    state.chats[existingIndex] = {
      ...mergedChat,
      // keep unread count if provided via preserve
      unreadCount:
        preserve?.unreadCount ?? state.chats[existingIndex].unreadCount ?? 0,
    };
  } else {
    state.chats.unshift({ ...mergedChat });
  }
};

// ===== Async Thunks =====

/**
 * Fetch all chats for the current user
 */
export const fetchChats = createAsyncThunk(
  "chat/fetchChats",
  async ({ cursor, limit }: { cursor?: string; limit?: number } = {}) => {
    const response = await getChats(cursor, limit);
    return { chats: response.chats, timestamp: Date.now() };
  },
);

/**
 * Fetch messages for a specific chat (initial load)
 */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({
    chatId,
    before,
    limit = 20,
  }: {
    chatId: string;
    before?: string;
    limit?: number;
  }) => {
    const response = await getMessages(chatId, before, limit);
    return {
      chatId,
      messages: response.messages,
      nextCursor: response.nextCursor,
    };
  },
);

/**
 * Fetch more (older) messages for a specific chat (pagination)
 */
export const fetchMoreMessages = createAsyncThunk(
  "chat/fetchMoreMessages",
  async (
    {
      chatId,
      limit = 10,
    }: {
      chatId: string;
      limit?: number;
    },
    { getState },
  ) => {
    const state = getState() as RootState;
    const cursor = state.chat.messageCursors[chatId];

    // If no cursor, there are no more messages
    if (cursor === null) {
      return { chatId, messages: [], nextCursor: null };
    }

    const response = await getMessages(chatId, cursor, limit);
    return {
      chatId,
      messages: response.messages,
      nextCursor: response.nextCursor,
    };
  },
);

/**
 * Send a message in a chat
 * Includes optimistic update
 */
export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      chatId,
      body,
      clientId,
    }: {
      chatId: string;
      body: string;
      clientId?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const data: CreateMessageRequest = {
        body,
        clientId: clientId || `${Date.now()}-${Math.random()}`,
      };
      const message = await apiSendMessage(chatId, data);
      return { chatId, message };
    } catch (error) {
      return rejectWithValue({
        chatId,
        clientId,
        error:
          error instanceof Error ? error.message : "Failed to send message",
      });
    }
  },
);

/**
 * Create a new chat (DM or group)
 */
export const createChat = createAsyncThunk(
  "chat/createChat",
  async (data: CreateChatRequest) => {
    const chat = await apiCreateChat(data);
    return chat;
  },
);

/**
 * Mark messages as read by updating the read cursor on the backend
 * This should be called when the user views messages in a chat
 */
export const markMessagesAsRead = createAsyncThunk(
  "chat/markMessagesAsRead",
  async (
    { chatId, messageId }: { chatId: string; messageId: string },
    { rejectWithValue },
  ) => {
    try {
      await apiUpdateReadCursor(chatId, messageId);
      return { chatId };
    } catch (error) {
      // Don't fail silently - log but don't block the UI
      console.error("Failed to update read cursor:", error);
      return rejectWithValue({
        chatId,
        error:
          error instanceof Error
            ? error.message
            : "Failed to mark messages as read",
      });
    }
  },
);

/**
 * Select a chat and fetch its messages
 * Also marks messages as read on the backend
 */
export const selectChat = createAsyncThunk(
  "chat/selectChat",
  async (chatId: string, { dispatch }) => {
    // Fetch messages for the selected chat
    const result = await dispatch(fetchMessages({ chatId }));

    // If messages were fetched successfully, mark the last one as read
    if (fetchMessages.fulfilled.match(result)) {
      const messages = result.payload.messages;
      if (messages.length > 0) {
        // The API returns messages newest first, so messages[0] is the newest
        const newestMessage = messages[0];
        // Fire and forget - don't await, don't block the UI
        dispatch(markMessagesAsRead({ chatId, messageId: newestMessage._id }));
      }
    }

    return chatId;
  },
);

// ===== Slice =====

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /**
     * Clear error states
     */
    clearError: (state, action: PayloadAction<keyof ChatState["error"]>) => {
      state.error[action.payload] = null;
    },

    /**
     * Add a new message from real-time event
     */
    addMessageFromEvent: (state, action: PayloadAction<MessageDTO>) => {
      const message = action.payload;
      const { chatId } = message;

      // Add message to the chat's message list
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }

      // Check if message already exists (prevent duplicates)
      const exists = state.messages[chatId].some((m) => m._id === message._id);
      if (!exists) {
        state.messages[chatId].push(message);
      }

      // Update chat preview
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].lastMessage = {
          _id: message._id,
          senderId: message.senderId,
          body: message.body.substring(0, 100),
          createdAt: message.createdAt,
        };

        // Increment unread count if not the active chat
        if (state.activeChatId !== chatId) {
          state.chats[chatIndex].unreadCount += 1;
        }

        // Move chat to top of list
        const [chat] = state.chats.splice(chatIndex, 1);
        state.chats.unshift(chat);
      }
    },

    /**
     * Update chat from real-time event
     */
    updateChatFromEvent: (state, action: PayloadAction<ChatDTO>) => {
      const updatedChat = action.payload;
      const existingChat = state.chats.find((c) => c._id === updatedChat._id);
      upsertChat(state, {
        ...updatedChat,
        unreadCount: existingChat?.unreadCount ?? 0,
        lastMessage: existingChat?.lastMessage,
      });
    },

    /**
     * Reset unread count for a chat
     */
    resetUnreadCount: (state, action: PayloadAction<string>) => {
      const chatId = action.payload;
      const chatIndex = state.chats.findIndex((c) => c._id === chatId);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount = 0;
      }
    },

    /**
     * Set active chat (without fetching messages)
     */
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeChatId = action.payload;

      // Reset unread count for the selected chat
      if (action.payload) {
        const chatIndex = state.chats.findIndex(
          (c) => c._id === action.payload,
        );
        if (chatIndex !== -1) {
          state.chats[chatIndex].unreadCount = 0;
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch chats
    builder
      .addCase(fetchChats.pending, (state) => {
        state.loading.chats = true;
        state.error.chats = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading.chats = false;
        state.chats = action.payload.chats;
        state.lastFetch = action.payload.timestamp;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading.chats = false;
        state.error.chats = action.error.message || "Failed to fetch chats";
      });

    // Fetch messages (initial load)
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.loading.messages = true;
        state.error.messages = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading.messages = false;
        const { chatId, messages, nextCursor } = action.payload;

        // Reverse messages so newest is at the bottom (API returns newest first)
        state.messages[chatId] = [...messages].reverse();
        // Store cursor for pagination (null means no more messages)
        state.messageCursors[chatId] = nextCursor ?? null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading.messages = false;
        state.error.messages =
          action.error.message || "Failed to fetch messages";
      });

    // Fetch more messages (pagination)
    builder
      .addCase(fetchMoreMessages.pending, (state) => {
        state.loading.loadingMore = true;
      })
      .addCase(fetchMoreMessages.fulfilled, (state, action) => {
        state.loading.loadingMore = false;
        const { chatId, messages, nextCursor } = action.payload;

        if (messages.length > 0) {
          // Prepend older messages (reversed since API returns newest first)
          const olderMessages = [...messages].reverse();
          state.messages[chatId] = [
            ...olderMessages,
            ...(state.messages[chatId] || []),
          ];
        }
        // Update cursor (null means no more messages)
        state.messageCursors[chatId] = nextCursor ?? null;
      })
      .addCase(fetchMoreMessages.rejected, (state) => {
        state.loading.loadingMore = false;
      });

    // Send message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.loading.sending = true;
        state.error.sending = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading.sending = false;
        const { chatId, message } = action.payload;

        // Add message to the chat's message list if not already present
        if (!state.messages[chatId]) {
          state.messages[chatId] = [];
        }

        const exists = state.messages[chatId].some(
          (m) => m._id === message._id,
        );
        if (!exists) {
          state.messages[chatId].push(message);
        }

        // Update chat preview
        const chatIndex = state.chats.findIndex((c) => c._id === chatId);
        if (chatIndex !== -1) {
          state.chats[chatIndex].lastMessage = {
            _id: message._id,
            senderId: message.senderId,
            body: message.body.substring(0, 100),
            createdAt: message.createdAt,
          };

          // Move chat to top of list
          const [chat] = state.chats.splice(chatIndex, 1);
          state.chats.unshift(chat);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading.sending = false;
        state.error.sending = action.error.message || "Failed to send message";
      });

    // Create chat
    builder
      .addCase(createChat.fulfilled, (state, action) => {
        upsertChat(state, {
          ...action.payload,
          unreadCount: 0,
        });
      })
      .addCase(createChat.rejected, (state, action) => {
        state.error.chats = action.error.message || "Failed to create chat";
      });

    // Select chat
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.activeChatId = action.payload;

      // Reset unread count
      const chatIndex = state.chats.findIndex((c) => c._id === action.payload);
      if (chatIndex !== -1) {
        state.chats[chatIndex].unreadCount = 0;
      }
    });
  },
});

export const {
  clearError,
  addMessageFromEvent,
  updateChatFromEvent,
  resetUnreadCount,
  setActiveChat,
} = chatSlice.actions;

export default chatSlice.reducer;

// ===== Selectors =====

export const selectChats = (state: RootState) => state.chat.chats;
export const selectActiveChatId = (state: RootState) => state.chat.activeChatId;
export const selectActiveChat = (state: RootState) => {
  if (!state.chat.activeChatId) return null;
  return (
    state.chat.chats.find((c) => c._id === state.chat.activeChatId) || null
  );
};
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectChatError = (state: RootState) => state.chat.error;

// Memoized selector to get messages for a specific chat
// This returns the actual array from state, not a function
export const selectMessagesForChat = (state: RootState, chatId: string) =>
  state.chat.messages[chatId] || EMPTY_MESSAGES;

// Memoized selector to get a specific chat by ID
export const selectChatById = (state: RootState, chatId: string) =>
  state.chat.chats.find((c) => c._id === chatId);

// Selector to check if there are more messages to load for a chat
export const selectHasMoreMessages = (state: RootState, chatId: string) =>
  state.chat.messageCursors[chatId] !== null;

// Selector to get loading more state
export const selectLoadingMore = (state: RootState) =>
  state.chat.loading.loadingMore;
