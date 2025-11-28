"use client";

import type { useChat } from "@ai-sdk/react";
import { Bot, MessageCircle } from "lucide-react";
import { useMemo } from "react";
import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import type { UserProfile } from "@/lib/api-client";
import { isAIMessage, toMessageDTOs } from "@/lib/utils/ai-message-utils";
import type { FamilyMember, MessageDTO } from "@/types/api.types";
import { UnifiedMessageList } from "./unified-message-list";

interface MessageListProps {
  messages: MessageDTO[] | ReturnType<typeof useChat>["messages"];
  isAIChat: boolean;
  loading: boolean;
  emptyState: { title: string; description: string };
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
  onRegenerate?: () => void;
  showReasoning?: boolean;
  aiName?: string;
  chatId?: string;
  isStreaming?: boolean;
  streamingText?: string;
  /** Streaming AI message content (for @mention invocation) */
  streamingAIMessage?: string;
}

export function MessageList({
  messages,
  isAIChat,
  loading,
  emptyState,
  currentUser,
  familyMembers,
  onRegenerate,
  aiName,
  chatId,
  isStreaming = false,
  streamingText = "AI is thinking...",
  streamingAIMessage,
}: MessageListProps) {
  // Convert UIMessages to MessageDTO if needed (for AI chats using useChat)
  const normalizedMessages = useMemo(() => {
    if (!isAIChat || messages.length === 0) {
      return messages as MessageDTO[];
    }

    // Check if messages are already MessageDTO format
    const firstMessage = messages[0];
    if ("_id" in firstMessage && "chatId" in firstMessage) {
      return messages as MessageDTO[];
    }

    // Convert UIMessage[] to MessageDTO[]
    return toMessageDTOs(
      messages as Parameters<typeof toMessageDTOs>[0],
      chatId || "",
      currentUser?.id || "",
    );
  }, [messages, isAIChat, chatId, currentUser?.id]);

  // Check if there are any AI messages in the list
  const hasAIMessages = useMemo(
    () => normalizedMessages.some((m) => isAIMessage(m)),
    [normalizedMessages],
  );

  // Empty state
  if (normalizedMessages.length === 0 && !loading) {
    return (
      <ConversationEmptyState
        description={emptyState.description}
        icon={
          isAIChat || hasAIMessages ? (
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
  if (loading && normalizedMessages.length === 0) {
    return (
      <div
        className="flex items-center justify-center py-8"
        data-testid="messages-loading"
      >
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Handle regenerate callback - convert to messageId-based callback
  const handleRegenerate = onRegenerate
    ? (_messageId: string) => onRegenerate()
    : undefined;

  return (
    <UnifiedMessageList
      messages={normalizedMessages}
      currentUser={currentUser}
      familyMembers={familyMembers}
      aiName={aiName}
      onRegenerate={handleRegenerate}
      isStreaming={isStreaming}
      streamingText={streamingText}
      streamingAIMessage={streamingAIMessage}
    />
  );
}
