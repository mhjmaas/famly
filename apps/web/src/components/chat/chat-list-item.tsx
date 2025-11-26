"use client";

import { Bot, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import type { ChatWithPreviewDTO } from "@/types/api.types";

interface ChatListItemProps {
  chat: ChatWithPreviewDTO;
  displayTitle?: string;
  isActive: boolean;
  onClick: () => void;
}

export function ChatListItem({
  chat,
  displayTitle,
  isActive,
  onClick,
}: ChatListItemProps) {
  const isAIChat = chat.type === "ai";

  // Get chat title with fallback
  const getChatTitle = () => {
    return (
      displayTitle ||
      chat.title ||
      (chat.type === "group"
        ? "Group Chat"
        : chat.type === "ai"
          ? "AI Assistant"
          : "Direct Message")
    );
  };

  // Get avatar icon based on chat type
  const getAvatarContent = () => {
    if (chat.type === "ai") {
      return <Bot className="h-5 w-5" />;
    }
    if (chat.type === "group") {
      return <Users className="h-5 w-5" />;
    }
    return getInitials(getChatTitle());
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={isAIChat ? "ai-chat-item" : "chat-list-item"}
      className={`w-full cursor-pointer overflow-hidden rounded-lg p-3 text-left transition-colors hover:bg-accent ${
        isActive ? "bg-accent" : ""
      } ${isAIChat ? "border-l-2 border-l-primary" : ""}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar
          className={`h-10 w-10 ${isAIChat ? "bg-primary/10 text-primary" : ""}`}
        >
          <AvatarFallback
            className={isAIChat ? "bg-primary/10 text-primary" : ""}
          >
            {getAvatarContent()}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium" data-testid="chat-item-name">
              {getChatTitle()}
            </span>
            {chat.lastMessage && (
              <span
                className="shrink-0 text-xs text-muted-foreground"
                data-testid="chat-item-time"
              >
                {formatRelativeTime(chat.lastMessage.createdAt)}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <div className="flex min-w-0">
              <p
                className="truncate text-sm text-muted-foreground"
                data-testid="chat-item-preview"
              >
                {chat.lastMessage.body}
              </p>
            </div>
          )}
        </div>

        {/* Unread Badge */}
        {chat.unreadCount > 0 && (
          <Badge
            variant="default"
            className="shrink-0"
            data-testid="chat-item-unread"
          >
            {chat.unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}
