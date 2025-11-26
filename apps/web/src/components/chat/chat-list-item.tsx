"use client";

import { Users } from "lucide-react";
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
  // Get chat title with fallback
  const getChatTitle = () => {
    return (
      displayTitle ||
      chat.title ||
      (chat.type === "group" ? "Group Chat" : "Direct Message")
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="chat-list-item"
      className={`w-full cursor-pointer overflow-hidden rounded-lg p-3 text-left transition-colors hover:bg-accent ${
        isActive ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {chat.type === "group" ? (
              <Users className="h-5 w-5" />
            ) : (
              getInitials(getChatTitle())
            )}
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
