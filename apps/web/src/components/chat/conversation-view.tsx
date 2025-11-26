"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  CopyIcon,
  Loader2,
  MessageCircle,
  RefreshCcwIcon,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  useStickToBottomContext,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/api-client";
import { toMessageDTOs, toUIMessages } from "@/lib/utils/ai-message-utils";
import { formatExactTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import { cn } from "@/lib/utils/style-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMessages,
  fetchMoreMessages,
  selectHasMoreMessages,
  selectLoadingMore,
  selectMessagesForChat,
  syncAIMessages,
} from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type {
  ChatWithPreviewDTO,
  FamilyMember,
  MessageDTO,
} from "@/types/api.types";
import { MessageInput, type MessageSubmitData } from "./message-input";

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
}

/**
 * Inner component that handles infinite scroll detection
 * Must be rendered inside a Conversation (StickToBottom) component
 */
function InfiniteScrollHandler({
  chatId,
  hasMoreMessages,
  loadingMore,
}: {
  chatId: string;
  hasMoreMessages: boolean;
  loadingMore: boolean;
}) {
  const dispatch = useAppDispatch();
  const { scrollRef, stopScroll } = useStickToBottomContext();
  const previousScrollHeightRef = useRef<number>(0);
  const previousScrollTopRef = useRef<number>(0);

  // Set up scroll event listener for infinite scroll
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      if (loadingMore || !hasMoreMessages) return;

      // Trigger load when within 100px of the top
      if (scrollElement.scrollTop < 100) {
        // Store current scroll state before loading
        previousScrollHeightRef.current = scrollElement.scrollHeight;
        previousScrollTopRef.current = scrollElement.scrollTop;
        // Stop the auto-scroll behavior so it doesn't jump to bottom
        stopScroll();
        dispatch(fetchMoreMessages({ chatId }));
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [scrollRef, chatId, hasMoreMessages, loadingMore, dispatch, stopScroll]);

  // Restore scroll position after loading more messages
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (
      !scrollElement ||
      loadingMore ||
      previousScrollHeightRef.current === 0
    ) {
      return;
    }

    // Calculate how much content was added and adjust scroll position
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      const newScrollHeight = scrollElement.scrollHeight;
      const heightDiff = newScrollHeight - previousScrollHeightRef.current;

      if (heightDiff > 0) {
        // Restore scroll position: add the height difference to maintain visual position
        scrollElement.scrollTop = previousScrollTopRef.current + heightDiff;
      }

      previousScrollHeightRef.current = 0;
      previousScrollTopRef.current = 0;
    });
  }, [scrollRef, loadingMore]);

  return null;
}

export function ConversationView({
  dict,
  chat,
  loading,
}: ConversationViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const familyMembers = useAppSelector(selectFamilyMembers);

  // Memoize selectors that depend on chat._id to avoid unnecessary rerenders
  const messagesSelector = useMemo(
    () => (state: Parameters<typeof selectMessagesForChat>[0]) =>
      chat ? selectMessagesForChat(state, chat._id) : [],
    [chat?._id],
  );
  const hasMoreSelector = useMemo(
    () => (state: Parameters<typeof selectHasMoreMessages>[0]) =>
      chat ? selectHasMoreMessages(state, chat._id) : false,
    [chat?._id],
  );

  const messages = useAppSelector(messagesSelector);
  const hasMoreMessages = useAppSelector(hasMoreSelector);
  const loadingMore = useAppSelector(selectLoadingMore);

  const isAIChat = chat?.type === "ai";

  // AI Chat hook - only active for AI chats
  const aiTransport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
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

  // Sync AI messages back to Redux when they change or streaming completes
  const prevAIMessagesLengthRef = useRef(0);
  const prevStatusRef = useRef(aiStatus);
  useEffect(() => {
    if (!isAIChat || !chat || !currentUser?.id) return;
    if (aiMessages.length === 0) return;

    const countChanged = aiMessages.length !== prevAIMessagesLengthRef.current;
    const streamingJustCompleted =
      prevStatusRef.current === "streaming" && aiStatus === "ready";

    // Sync when: message count changes OR streaming just completed (to capture final content)
    if (countChanged || streamingJustCompleted) {
      prevAIMessagesLengthRef.current = aiMessages.length;
      prevStatusRef.current = aiStatus;

      const reduxMessages = toMessageDTOs(
        aiMessages as Parameters<typeof toMessageDTOs>[0],
        chat._id,
        currentUser.id,
      );
      dispatch(syncAIMessages({ chatId: chat._id, messages: reduxMessages }));
    } else {
      prevStatusRef.current = aiStatus;
    }
  }, [aiMessages, aiStatus, isAIChat, chat, currentUser?.id, dispatch]);

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
        aiSendMessage({ text: data.text });
      }
    },
    [aiSendMessage],
  );

  // Fetch messages when chat changes (only for non-AI chats)
  useEffect(() => {
    if (chat && !isAIChat) {
      dispatch(fetchMessages({ chatId: chat._id }));
    }
  }, [chat, isAIChat, dispatch]);

  if (!chat) {
    return (
      <div
        className="flex h-full flex-col items-center justify-center gap-4 text-center"
        data-testid="conversation-empty"
      >
        <MessageCircle className="h-16 w-16 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">
            {dict.conversation.emptyState.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dict.conversation.emptyState.description}
          </p>
        </div>
      </div>
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
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
          />

          {/* AI streaming indicator */}
          {isAIChat && aiChat.isStreaming && aiChat.messages.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
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
          enableWebSearch={false}
          onSendMessage={isAIChat ? handleAISendMessage : undefined}
          isLoading={aiChat.isStreaming || aiChat.isSubmitting}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components for better organization
// ============================================================================

interface ConversationHeaderProps {
  title: string;
  isAIChat: boolean;
  isStreaming: boolean;
}

function ConversationHeader({
  title,
  isAIChat,
  isStreaming,
}: ConversationHeaderProps) {
  return (
    <div
      className="border-b border-border p-4"
      data-testid="conversation-header"
    >
      <div className="flex items-center gap-2">
        {isAIChat && <Bot className="h-5 w-5 text-primary" />}
        <h2 className="text-lg font-semibold" data-testid="conversation-title">
          {title}
        </h2>
        {isStreaming && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: MessageDTO[] | ReturnType<typeof useChat>["messages"];
  isAIChat: boolean;
  loading: boolean;
  emptyState: { title: string; description: string };
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
  onRegenerate?: () => void;
}

function MessageList({
  messages,
  isAIChat,
  loading,
  emptyState,
  currentUser,
  familyMembers,
  onRegenerate,
}: MessageListProps) {
  // Empty state
  if (messages.length === 0 && !loading) {
    return (
      <ConversationEmptyState
        description={emptyState.description}
        icon={
          isAIChat ? (
            <Bot className="size-6" />
          ) : (
            <MessageCircle className="size-6" />
          )
        }
        title={emptyState.title}
      />
    );
  }

  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-8"
        data-testid="messages-loading"
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Render messages based on chat type
  if (isAIChat) {
    return (
      <AIMessageList
        messages={messages as ReturnType<typeof useChat>["messages"]}
        currentUser={currentUser}
        onRegenerate={onRegenerate}
      />
    );
  }

  return (
    <RegularMessageList
      messages={messages as MessageDTO[]}
      currentUser={currentUser}
      familyMembers={familyMembers}
    />
  );
}

interface AIMessageListProps {
  messages: ReturnType<typeof useChat>["messages"];
  currentUser: UserProfile | null;
  onRegenerate?: () => void;
}

function AIMessageList({
  messages,
  currentUser,
  onRegenerate,
}: AIMessageListProps) {
  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <>
      {messages.map((message, messageIndex) => {
        const isUser = message.role === "user";
        const isLastMessage = messageIndex === messages.length - 1;

        return (
          <Fragment key={message.id}>
            {message.parts.map((part, partIndex) => {
              if (part.type === "text") {
                return (
                  <Fragment key={`${message.id}-${partIndex}`}>
                    <div
                      data-testid="message-item"
                      className={cn(
                        "flex gap-2",
                        isUser ? "flex-row-reverse" : "flex-row",
                      )}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback>
                          {isUser
                            ? currentUser?.name
                              ? getInitials(currentUser.name)
                              : "ME"
                            : "AI"}
                        </AvatarFallback>
                      </Avatar>

                      <Message from={message.role}>
                        <MessageContent data-testid="message-body">
                          {isUser ? (
                            part.text
                          ) : (
                            <MessageResponse>{part.text}</MessageResponse>
                          )}
                        </MessageContent>
                      </Message>
                    </div>

                    {/* Actions for assistant messages on the last message */}
                    {message.role === "assistant" &&
                      isLastMessage &&
                      part.text && (
                        <MessageActions className="ml-10">
                          {onRegenerate && (
                            <MessageAction
                              onClick={() => onRegenerate()}
                              label="Regenerate"
                              tooltip="Regenerate response"
                            >
                              <RefreshCcwIcon className="size-3" />
                            </MessageAction>
                          )}
                          <MessageAction
                            onClick={() => handleCopyText(part.text)}
                            label="Copy"
                            tooltip="Copy to clipboard"
                          >
                            <CopyIcon className="size-3" />
                          </MessageAction>
                        </MessageActions>
                      )}
                  </Fragment>
                );
              }
              return null;
            })}
          </Fragment>
        );
      })}
    </>
  );
}

interface RegularMessageListProps {
  messages: MessageDTO[];
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
}

function RegularMessageList({
  messages,
  currentUser,
  familyMembers,
}: RegularMessageListProps) {
  const getSenderInitials = (message: MessageDTO): string => {
    if (message.senderId === currentUser?.id) {
      return currentUser?.name ? getInitials(currentUser.name) : "ME";
    }
    const member = familyMembers.find((m) => m.memberId === message.senderId);
    return member?.name ? getInitials(member.name) : "?";
  };

  const shouldShowAvatar = (message: MessageDTO, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    if (prevMessage.senderId !== message.senderId) return true;
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

  return (
    <>
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUser?.id;
        const showAvatar = shouldShowAvatar(message, index);

        return (
          <div
            key={message._id}
            data-testid="message-item"
            className={cn(
              "flex gap-2",
              isOwnMessage ? "flex-row-reverse" : "flex-row",
            )}
          >
            {showAvatar ? (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback>{getSenderInitials(message)}</AvatarFallback>
              </Avatar>
            ) : (
              <div className="w-8 shrink-0" />
            )}

            <Message from={isOwnMessage ? "user" : "assistant"}>
              <MessageContent data-testid="message-body">
                {message.body}
              </MessageContent>
              <span
                className={cn(
                  "text-xs text-muted-foreground",
                  isOwnMessage ? "ml-auto" : "",
                )}
              >
                {formatExactTime(message.createdAt)}
              </span>
            </Message>
          </div>
        );
      })}
    </>
  );
}
