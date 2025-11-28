"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { useAIMentionInvocation } from "@/hooks/use-ai-mention-invocation";
import { clearChatMessages } from "@/lib/api-client";
import { persistAIMessages, toUIMessages } from "@/lib/utils/ai-message-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearChatMessages as clearChatMessagesAction,
  fetchMessages,
  selectHasMoreMessages,
  selectLoadingMore,
  selectMessagesForChat,
} from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { ChatWithPreviewDTO } from "@/types/api.types";
import { ConversationEmpty } from "./conversation-empty";
import { ConversationHeader } from "./conversation-header";
import { InfiniteScrollHandler } from "./infinite-scroll-handler";
import {
  type AIMentionData,
  MessageInput,
  type MessageSubmitData,
} from "./message-input";
import { MessageList } from "./message-list-wrapper";

interface ConversationViewProps {
  dict: {
    conversation: {
      emptyState: {
        title: string;
        description: string;
      };
      noMessages: {
        title: string;
        description: string;
      };
      loading: string;
    };
    aiChat?: {
      defaultName: string;
      emptyState: {
        title: string;
        description: string;
      };
      placeholder: string;
    };
    aiMention?: {
      processing: string;
    };
    clearChat?: {
      button: string;
      title: string;
      description: string;
      cancel: string;
      confirm: string;
    };
    messageInput: {
      placeholder: string;
      shiftEnterHint: string;
      characterCount: string;
    };
    errors: {
      messageTooLong?: string;
      sendMessage: string;
    };
  };
  chat: ChatWithPreviewDTO | null;
  loading: boolean;
  /** Whether to show AI reasoning in the conversation. Defaults to false. */
  showReasoning?: boolean;
  /** AI assistant name for @mention detection (e.g., "Jarvis") */
  aiName?: string;
  /** Whether AI integration is enabled for this family */
  aiIntegrationEnabled?: boolean;
}

export function ConversationView({
  dict,
  chat,
  loading,
  showReasoning = false,
  aiName,
  aiIntegrationEnabled = false,
}: ConversationViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const familyMembers = useAppSelector(selectFamilyMembers);

  // Memoize selectors that depend on chat._id to avoid unnecessary rerenders
  // biome-ignore lint/correctness/useExhaustiveDependencies(chat?._id): suppress dependency chat
  // biome-ignore lint/correctness/useExhaustiveDependencies(chat): suppress dependency chat
  const messagesSelector = useMemo(
    () => (state: Parameters<typeof selectMessagesForChat>[0]) =>
      chat ? selectMessagesForChat(state, chat._id) : [],
    [chat?._id],
  );
  // biome-ignore lint/correctness/useExhaustiveDependencies(chat?._id): suppress dependency chat
  // biome-ignore lint/correctness/useExhaustiveDependencies(chat): suppress dependency chat
  const hasMoreSelector = useMemo(
    () => (state: Parameters<typeof selectHasMoreMessages>[0]) =>
      chat ? selectHasMoreMessages(state, chat._id) : false,
    [chat?._id],
  );

  const messages = useAppSelector(messagesSelector);
  const hasMoreMessages = useAppSelector(hasMoreSelector);
  const loadingMore = useAppSelector(selectLoadingMore);

  const isAIChat = chat?.type === "ai";

  // Clear chat state
  const [isClearingChat, setIsClearingChat] = useState(false);

  // Track current webSearch state for transport
  const webSearchRef = useRef(false);

  // AI Chat hook - only active for AI chats
  // Custom transport that includes webSearch in request body
  const aiTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, options) => {
          // Add webSearch to request body
          const body = options?.body ? JSON.parse(options.body as string) : {};
          body.data = { webSearch: webSearchRef.current };

          return fetch(url, {
            ...options,
            body: JSON.stringify(body),
          });
        },
      }),
    [],
  );
  const {
    messages: aiMessages,
    sendMessage: aiSendMessage,
    setMessages: setAIMessages,
    status: aiStatus,
    regenerate: aiRegenerate,
  } = useChat({
    id: chat?._id ?? "default",
    transport: aiTransport,
  });

  // Restore AI messages from Redux when chat changes
  const hasRestoredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isAIChat || !chat) return;

    // Only restore once per chat (avoid overwriting during streaming)
    if (hasRestoredRef.current === chat._id) return;

    // If we have messages in Redux and AI SDK has none, restore them
    if (messages.length > 0 && aiMessages.length === 0) {
      const uiMessages = toUIMessages(messages);
      setAIMessages(uiMessages);
      hasRestoredRef.current = chat._id;
    } else if (messages.length === 0 && aiMessages.length === 0) {
      // No messages anywhere, mark as restored to avoid re-checking
      hasRestoredRef.current = chat._id;
    }
  }, [isAIChat, chat, messages, aiMessages.length, setAIMessages]);

  // Reset restoration flag when chat changes
  useEffect(() => {
    if (chat?._id !== hasRestoredRef.current) {
      hasRestoredRef.current = null;
    }
  }, [chat?._id]);

  // Initialize persisted message IDs from Redux messages
  const [persistedMessageIds, setPersistedMessageIds] = useState<Set<string>>(
    () => {
      // On initial load, all messages in Redux were already persisted to the API
      return new Set(messages.map((m) => m._id));
    },
  );

  // Update persisted message IDs when Redux messages change
  useEffect(() => {
    setPersistedMessageIds((prev) => {
      const updated = new Set(prev);
      messages.forEach((m) => {
        updated.add(m._id);
      });
      return updated;
    });
  }, [messages]);

  // Persist AI messages to API when streaming completes
  const prevStatusRef = useRef(aiStatus);
  useEffect(() => {
    if (!isAIChat || !chat || !currentUser?.id) return;
    if (aiMessages.length === 0) return;

    const streamingJustCompleted =
      prevStatusRef.current === "streaming" && aiStatus === "ready";
    prevStatusRef.current = aiStatus;

    // Only persist when streaming completes (not during streaming)
    if (streamingJustCompleted) {
      persistAIMessages(
        chat._id,
        aiMessages as Parameters<typeof persistAIMessages>[1],
        currentUser.id,
        persistedMessageIds,
      ).then((newlyPersisted) => {
        if (newlyPersisted.size > 0) {
          setPersistedMessageIds((prev) => {
            const updated = new Set(prev);
            newlyPersisted.forEach((id) => {
              updated.add(id);
            });
            return updated;
          });
        }
      });
    }
  }, [
    aiMessages,
    aiStatus,
    isAIChat,
    chat,
    currentUser?.id,
    persistedMessageIds,
  ]);

  const aiChat = useMemo(
    () => ({
      messages: isAIChat ? aiMessages : [],
      sendMessage: aiSendMessage,
      regenerate: aiRegenerate,
      isStreaming: aiStatus === "streaming",
      isSubmitting: aiStatus === "submitted",
    }),
    [isAIChat, aiMessages, aiSendMessage, aiRegenerate, aiStatus],
  );

  // Handler for AI message sending
  const handleAISendMessage = useCallback(
    (data: MessageSubmitData) => {
      if (data.text.trim()) {
        // Update webSearch ref so transport can read it
        webSearchRef.current = data.webSearch ?? false;

        aiSendMessage({
          text: data.text,
          files: data.files,
        });
      }
    },
    [aiSendMessage],
  );

  // Handler for clearing AI chat history
  const handleClearChat = useCallback(async () => {
    if (!chat || !isAIChat) return;

    setIsClearingChat(true);
    try {
      // Call API to delete messages from database
      await clearChatMessages(chat._id);
      // Clear messages from Redux store
      dispatch(clearChatMessagesAction(chat._id));
      // Clear local AI messages (useChat hook state)
      setAIMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    } finally {
      setIsClearingChat(false);
    }
  }, [chat, isAIChat, setAIMessages, dispatch]);

  // AI mention invocation for DM/Group chats
  const {
    isProcessing: isAIMentionProcessing,
    streamingText: aiMentionStreamingText,
    invokeAI,
  } = useAIMentionInvocation({
    chatId: chat?._id || "",
    onResponse: () => {
      // Refresh messages to show the AI response
      if (chat) {
        dispatch(fetchMessages({ chatId: chat._id }));
      }
    },
  });

  // Handler for AI @mention in DM/Group chats
  const handleAIMention = useCallback(
    async (data: AIMentionData) => {
      if (!aiIntegrationEnabled || !aiName) return;

      // Invoke AI with the question and recent context
      await invokeAI(data.question, messages);
    },
    [aiIntegrationEnabled, aiName, invokeAI, messages],
  );

  // Fetch messages when chat changes (for all chat types - AI chats are now persisted)
  useEffect(() => {
    if (chat) {
      dispatch(fetchMessages({ chatId: chat._id }));
    }
  }, [chat, dispatch]);

  if (!chat) {
    return (
      <ConversationEmpty
        title={dict.conversation.emptyState.title}
        description={dict.conversation.emptyState.description}
      />
    );
  }

  // Determine chat title based on type
  const chatTitle =
    chat.title ||
    (isAIChat ? dict.aiChat?.defaultName || "AI Assistant" : "Direct Message");

  // Get empty state content based on chat type
  const emptyStateContent =
    isAIChat && dict.aiChat
      ? {
          title: dict.aiChat.emptyState.title,
          description: dict.aiChat.emptyState.description,
        }
      : {
          title: dict.conversation.noMessages.title,
          description: dict.conversation.noMessages.description,
        };

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid={isAIChat ? "ai-chat-conversation" : "conversation-view"}
    >
      {/* Chat Header */}
      <ConversationHeader
        title={chatTitle}
        isAIChat={isAIChat}
        isStreaming={aiChat.isStreaming || aiChat.isSubmitting}
        onClearChat={isAIChat ? handleClearChat : undefined}
        isClearingChat={isClearingChat}
        dict={dict.clearChat ? { clearChat: dict.clearChat } : undefined}
      />

      {/* Messages */}
      <Conversation className="min-h-0 flex-1" data-testid="message-list">
        {/* Infinite scroll handler - only for non-AI chats */}
        {!isAIChat && (
          <InfiniteScrollHandler
            chatId={chat._id}
            hasMoreMessages={hasMoreMessages}
            loadingMore={loadingMore}
          />
        )}

        <ConversationContent>
          {/* Loading more indicator at top (non-AI chats) */}
          {!isAIChat && loadingMore && (
            <div
              className="flex items-center justify-center py-2"
              data-testid="loading-more"
            >
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          )}

          {/* Messages list */}
          <MessageList
            messages={isAIChat ? aiChat.messages : messages}
            isAIChat={isAIChat}
            loading={loading}
            emptyState={emptyStateContent}
            currentUser={currentUser}
            familyMembers={familyMembers}
            onRegenerate={isAIChat ? aiChat.regenerate : undefined}
            showReasoning={showReasoning}
            aiName={chat?.title || "AI Assistant"}
            chatId={chat._id}
            isStreaming={isAIChat ? aiChat.isStreaming : isAIMentionProcessing}
            streamingText={dict.aiMention?.processing || "AI is thinking..."}
            streamingAIMessage={!isAIChat ? aiMentionStreamingText : undefined}
          />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <MessageInput
          chatId={isAIChat ? undefined : chat._id}
          dict={dict}
          placeholderOverride={isAIChat ? dict.aiChat?.placeholder : undefined}
          enableModelSelector={false}
          enableWebSearch={isAIChat}
          onSendMessage={isAIChat ? handleAISendMessage : undefined}
          isLoading={
            aiChat.isStreaming || aiChat.isSubmitting || isAIMentionProcessing
          }
          // AI @mention support for DM/Group chats
          aiName={aiName}
          enableAIMention={aiIntegrationEnabled && !isAIChat}
          onAIMention={handleAIMention}
        />
      </div>
    </div>
  );
}
