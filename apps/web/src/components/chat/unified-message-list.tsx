"use client";

import { CopyIcon, Loader2, RefreshCcwIcon } from "lucide-react";
import { Fragment, useCallback } from "react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/api-client";
import { isAIMessage } from "@/lib/utils/ai-message-utils";
import { formatExactTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import { cn } from "@/lib/utils/style-utils";
import type { FamilyMember, MessageDTO } from "@/types/api.types";

interface UnifiedMessageListProps {
  messages: MessageDTO[];
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
  aiName?: string;
  onRegenerate?: (messageId: string) => void;
  isStreaming?: boolean;
  streamingText?: string;
  /** Streaming AI message content (for @mention invocation) */
  streamingAIMessage?: string;
}

/**
 * Unified message list component that renders both user messages and AI messages.
 * AI messages are rendered with markdown support, user messages with avatars and timestamps.
 * This component is used for all chat types (DM, Group, AI).
 */
export function UnifiedMessageList({
  messages,
  currentUser,
  familyMembers,
  aiName = "AI Assistant",
  onRegenerate,
  isStreaming = false,
  streamingText = "AI is thinking...",
  streamingAIMessage,
}: UnifiedMessageListProps) {
  const handleCopyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  const getSenderInitials = (message: MessageDTO): string => {
    if (isAIMessage(message)) {
      return getInitials(aiName);
    }
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

  // Find the last AI message for regenerate button
  const lastAIMessageId = [...messages]
    .reverse()
    .find((m) => isAIMessage(m))?._id;

  return (
    <>
      {messages.map((message, index) => {
        const isAI = isAIMessage(message);
        const isOwnMessage = message.senderId === currentUser?.id;
        const showAvatar = shouldShowAvatar(message, index);
        const isLastAIMessage = message._id === lastAIMessageId;

        // Determine message alignment: own messages right, others left
        const alignRight = isOwnMessage;

        return (
          <Fragment key={message._id}>
            <div
              data-testid="message-item"
              className={cn(
                "flex gap-2",
                alignRight ? "flex-row-reverse" : "flex-row",
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
                  {isAI ? (
                    // AI messages get markdown rendering
                    <MessageResponse>{message.body}</MessageResponse>
                  ) : (
                    // User messages are plain text
                    message.body
                  )}
                </MessageContent>

                {/* AI streaming indicator */}
                {isAI && isLastAIMessage && isStreaming && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{streamingText}</span>
                  </div>
                )}

                {/* Actions for AI messages on the last AI message */}
                {isAI && isLastAIMessage && message.body && (
                  <MessageActions>
                    {onRegenerate && (
                      <MessageAction
                        onClick={() => onRegenerate(message._id)}
                        label="Regenerate"
                        tooltip="Regenerate response"
                      >
                        <RefreshCcwIcon className="size-3" />
                      </MessageAction>
                    )}
                    <MessageAction
                      onClick={() => handleCopyText(message.body)}
                      label="Copy"
                      tooltip="Copy to clipboard"
                    >
                      <CopyIcon className="size-3" />
                    </MessageAction>
                  </MessageActions>
                )}

                {/* Timestamp for non-AI messages */}
                {!isAI && (
                  <span
                    className={cn(
                      "text-xs text-muted-foreground",
                      alignRight ? "ml-auto" : "",
                    )}
                  >
                    {formatExactTime(message.createdAt)}
                  </span>
                )}
              </Message>
            </div>
          </Fragment>
        );
      })}

      {/* Streaming AI message (for @mention invocation) */}
      {streamingAIMessage && (
        <div data-testid="streaming-ai-message" className="flex gap-2 flex-row">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback>{getInitials(aiName)}</AvatarFallback>
          </Avatar>

          <Message from="assistant">
            <MessageContent data-testid="streaming-message-body">
              <MessageResponse>{streamingAIMessage}</MessageResponse>
            </MessageContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{streamingText}</span>
            </div>
          </Message>
        </div>
      )}
    </>
  );
}
