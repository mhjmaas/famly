"use client";

import { Message, MessageContent } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/api-client";
import { formatExactTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import { cn } from "@/lib/utils/style-utils";
import type { FamilyMember, MessageDTO } from "@/types/api.types";

interface RegularMessageListProps {
  messages: MessageDTO[];
  currentUser: UserProfile | null;
  familyMembers: readonly FamilyMember[];
}

export function RegularMessageList({
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
