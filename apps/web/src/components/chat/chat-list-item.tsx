"use client";

import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import type { ChatWithPreviewDTO } from "@/types/api.types";

interface ChatListItemProps {
  chat: ChatWithPreviewDTO;
  isActive: boolean;
  onClick: () => void;
}

export function ChatListItem({ chat, isActive, onClick }: ChatListItemProps) {
  // Get chat title with fallback
  const getChatTitle = () => {
    return (
      chat.title || (chat.type === "group" ? "Group Chat" : "Direct Message")
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${
        isActive ? "bg-accent" : ""
      }`}
    >
      <div className="flex items-start gap-3">
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
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{getChatTitle()}</span>
            {chat.lastMessage && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(chat.lastMessage.createdAt)}
              </span>
            )}
          </div>
          {chat.lastMessage && (
            <p className="truncate text-sm text-muted-foreground">
              {chat.lastMessage.body}
            </p>
          )}
        </div>

        {/* Unread Badge */}
        {chat.unreadCount > 0 && (
          <Badge variant="default" className="ml-auto">
            {chat.unreadCount}
          </Badge>
        )}
      </div>
    </button>
  );
}
