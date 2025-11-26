"use client";

import { Bot, Loader2, MessageCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  useStickToBottomContext,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { ChatWithPreviewDTO, MessageDTO } from "@/types/api.types";
import { MessageInput } from "./message-input";

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
  const messages = useAppSelector((state) =>
    chat ? selectMessagesForChat(state, chat._id) : [],
  );
  const hasMoreMessages = useAppSelector((state) =>
    chat ? selectHasMoreMessages(state, chat._id) : false,
  );
  const loadingMore = useAppSelector(selectLoadingMore);

  const isAIChat = chat?.type === "ai";

  // Fetch messages when chat changes
  useEffect(() => {
    if (chat) {
      dispatch(fetchMessages({ chatId: chat._id }));
    }
  }, [chat, dispatch]);

  // Helper to get sender initials
  const getSenderInitials = (message: MessageDTO): string => {
    // Check if this is the current user's message
    if (message.senderId === currentUser?.id) {
      // Use current user's name for their own messages
      if (currentUser?.name) {
        return getInitials(currentUser.name);
      }
      return "ME";
    }

    // For other users, look up in family members
    const member = familyMembers.find((m) => m.memberId === message.senderId);
    if (member?.name) {
      return getInitials(member.name);
    }

    // Fallback: unknown user
    return "?";
  };

  // Helper to check if avatar should be shown
  const shouldShowAvatar = (message: MessageDTO, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    if (prevMessage.senderId !== message.senderId) return true;
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

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

  return (
    <div
      className="flex h-full min-h-0 flex-col"
      data-testid={isAIChat ? "ai-chat-conversation" : "conversation-view"}
    >
      {/* Chat Header */}
      <div
        className="border-b border-border p-4"
        data-testid="conversation-header"
      >
        <div className="flex items-center gap-2">
          {isAIChat && <Bot className="h-5 w-5 text-primary" />}
          <h2
            className="text-lg font-semibold"
            data-testid="conversation-title"
          >
            {chat.title ||
              (isAIChat
                ? dict.aiChat?.defaultName || "AI Assistant"
                : "Direct Message")}
          </h2>
        </div>
      </div>

      {/* Messages using AI Elements Conversation */}
      <Conversation className="min-h-0 flex-1" data-testid="message-list">
        {/* Infinite scroll handler - must be inside Conversation for context */}
        <InfiniteScrollHandler
          chatId={chat._id}
          hasMoreMessages={hasMoreMessages}
          loadingMore={loadingMore}
        />

        <ConversationContent>
          {/* Loading more indicator at top */}
          {loadingMore && (
            <div
              className="flex items-center justify-center py-2"
              data-testid="loading-more"
            >
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <ConversationEmptyState
              description={
                isAIChat && dict.aiChat
                  ? dict.aiChat.emptyState.description
                  : dict.conversation.noMessages.description
              }
              icon={
                isAIChat ? (
                  <Bot className="size-6" />
                ) : (
                  <MessageCircle className="size-6" />
                )
              }
              title={
                isAIChat && dict.aiChat
                  ? dict.aiChat.emptyState.title
                  : dict.conversation.noMessages.title
              }
            />
          ) : loading && messages.length === 0 ? (
            <div
              className="flex items-center justify-center py-8"
              data-testid="messages-loading"
            >
              <p className="text-sm text-muted-foreground">
                {dict.conversation.loading}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
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
                  {/* Avatar */}
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        {getSenderInitials(message)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  {/* Message using AI Elements */}
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
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <MessageInput
          chatId={chat._id}
          dict={dict}
          placeholderOverride={isAIChat ? dict.aiChat?.placeholder : undefined}
          data-testid={isAIChat ? "ai-chat-input" : undefined}
        />
      </div>
    </div>
  );
}
