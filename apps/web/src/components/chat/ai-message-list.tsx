"use client";

import type { useChat } from "@ai-sdk/react";
import { CopyIcon, RefreshCcwIcon } from "lucide-react";
import { Fragment, useCallback } from "react";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/api-client";
import { getInitials } from "@/lib/utils/family-utils";
import { cn } from "@/lib/utils/style-utils";

interface AIMessageListProps {
  messages: ReturnType<typeof useChat>["messages"];
  currentUser: UserProfile | null;
  onRegenerate?: () => void;
  showReasoning?: boolean;
  aiName?: string;
}

export function AIMessageList({
  messages,
  currentUser,
  onRegenerate,
  showReasoning = false,
  aiName = "AI Assistant",
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
              if (part.type === "reasoning" && showReasoning) {
                return (
                  <Reasoning
                    key={`${message.id}-${partIndex}`}
                    className="w-full ml-10"
                    isStreaming={
                      partIndex === message.parts.length - 1 && isLastMessage
                    }
                  >
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text}</ReasoningContent>
                  </Reasoning>
                );
              }

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
                            : getInitials(aiName)}
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
                        {/* Actions for assistant messages on the last message */}
                        {message.role === "assistant" &&
                          isLastMessage &&
                          part.text && (
                            <MessageActions>
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
                      </Message>
                    </div>
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
