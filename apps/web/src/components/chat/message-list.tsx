"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/style-utils";
import { useAppSelector } from "@/store/hooks";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { ChatWithPreviewDTO, MessageDTO } from "@/types/api.types";

interface MessageListProps {
  messages: MessageDTO[];
  dict: any;
  loading: boolean;
  chat: ChatWithPreviewDTO;
}

export function MessageList({
  messages,
  dict,
  loading,
  chat,
}: MessageListProps) {
  const currentUser = useAppSelector(selectUser);
  const familyMembers = useAppSelector(selectFamilyMembers);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">
          {dict.conversation.loading}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const isOwnMessage = message.senderId === currentUser?.id;
        const showAvatar =
          index === 0 ||
          messages[index - 1].senderId !== message.senderId ||
          new Date(message.createdAt).getTime() -
            new Date(messages[index - 1].createdAt).getTime() >
            300000; // 5 minutes

        return (
          <MessageItem
            key={message._id}
            message={message}
            isOwnMessage={isOwnMessage}
            showAvatar={showAvatar}
            dict={dict}
            chat={chat}
            familyMembers={familyMembers}
          />
        );
      })}
    </div>
  );
}

interface MessageItemProps {
  message: MessageDTO;
  isOwnMessage: boolean;
  showAvatar: boolean;
  dict: any;
  chat: ChatWithPreviewDTO;
  familyMembers: any[];
}

function MessageItem({
  message,
  isOwnMessage,
  showAvatar,
  dict,
  chat,
  familyMembers,
}: MessageItemProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get sender's initials
  const getSenderInitials = () => {
    if (isOwnMessage) {
      return dict.conversation.you[0];
    }

    // For DM, find the other member
    const otherMember = familyMembers.find(
      (m) => m.memberId === message.senderId,
    );
    if (otherMember) {
      return otherMember.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }

    return "U";
  };

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwnMessage ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-8 w-8">
          <AvatarFallback>{getSenderInitials()}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="w-8" />
      )}

      {/* Message Content */}
      <div
        className={cn(
          "flex max-w-[70%] flex-col gap-1",
          isOwnMessage ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isOwnMessage
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.body}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTime(message.createdAt)}
        </span>
      </div>
    </div>
  );
}
