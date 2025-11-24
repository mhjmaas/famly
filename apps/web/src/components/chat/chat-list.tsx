"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveChatId, selectChat } from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { ChatWithPreviewDTO } from "@/types/api.types";
import { MessageSquarePlus, Users } from "lucide-react";
import { useState } from "react";
import { NewChatDialog } from "./new-chat-dialog";

interface ChatListProps {
  dict: any;
  chats: ChatWithPreviewDTO[];
  loading: boolean;
}

export function ChatList({ dict, chats, loading }: ChatListProps) {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const familyMembers = useAppSelector(selectFamilyMembers);
  const currentUser = useAppSelector(selectUser);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const handleChatSelect = (chatId: string) => {
    dispatch(selectChat(chatId));
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex-1 space-y-2 p-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">{dict.chatList.title}</h2>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="font-medium">{dict.chatList.emptyState.title}</h3>
            <p className="text-sm text-muted-foreground">
              {dict.chatList.emptyState.description}
            </p>
          </div>
          <Button onClick={() => setIsNewChatOpen(true)}>
            {dict.chatList.emptyState.action}
          </Button>
        </div>
        <NewChatDialog
          dict={dict}
          open={isNewChatOpen}
          onOpenChange={setIsNewChatOpen}
          familyMembers={familyMembers}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold">{dict.chatList.title}</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsNewChatOpen(true)}
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {chats.map((chat) => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              isActive={chat._id === activeChatId}
              onClick={() => handleChatSelect(chat._id)}
              dict={dict}
              familyMembers={familyMembers}
              currentUserId={currentUser?.id}
            />
          ))}
        </div>
      </ScrollArea>

      <NewChatDialog
        dict={dict}
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        familyMembers={familyMembers}
      />
    </div>
  );
}

interface ChatListItemProps {
  chat: ChatWithPreviewDTO;
  isActive: boolean;
  onClick: () => void;
  dict: any;
  familyMembers: readonly { memberId: string; name: string }[];
  currentUserId?: string;
}

function ChatListItem({
  chat,
  isActive,
  onClick,
  dict,
  familyMembers,
  currentUserId,
}: ChatListItemProps) {
  // Get chat title or member names for DM
  const getChatTitle = () => {
    if (chat.type === "group") {
      return chat.title || "Group Chat";
    }
    // For DM, show the other member's name (not the current user)
    const otherMemberId = chat.memberIds.find((id) => id !== currentUserId);
    const member = familyMembers.find((m) => m.memberId === otherMemberId);
    return member?.name || "Direct Message";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins}m`;
    }
    if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h`;
    }
    return date.toLocaleDateString();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg p-3 text-left transition-colors hover:bg-accent ${isActive ? "bg-accent" : ""
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
                {formatTime(chat.lastMessage.createdAt)}
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
