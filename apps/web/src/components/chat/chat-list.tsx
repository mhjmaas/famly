"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveChatId, selectChat } from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import type { ChatWithPreviewDTO } from "@/types/api.types";
import { ChatListEmpty } from "./chat-list-empty";
import { ChatListItem } from "./chat-list-item";
import { ChatListLoading } from "./chat-list-loading";
import { NewChatDialog } from "./new-chat-dialog";

interface ChatListProps {
  dict: {
    chatList: {
      title: string;
      emptyState: {
        title: string;
        description: string;
        action: string;
      };
    };
  };
  chats: ChatWithPreviewDTO[];
  loading: boolean;
}

export function ChatList({ dict, chats, loading }: ChatListProps) {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const familyMembers = useAppSelector(selectFamilyMembers);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const handleChatSelect = (chatId: string) => {
    dispatch(selectChat(chatId));
  };

  if (loading) {
    return <ChatListLoading />;
  }

  if (chats.length === 0) {
    return <ChatListEmpty dict={dict} familyMembers={familyMembers} />;
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
