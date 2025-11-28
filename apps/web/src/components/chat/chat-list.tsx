"use client";

import { FeatureKey } from "@famly/shared";
import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveChatId, selectChat } from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectIsFeatureEnabled } from "@/store/slices/settings.slice";
import { selectCurrentFamily, selectUser } from "@/store/slices/user.slice";
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
    newChatDialog: {
      title: string;
      dm: {
        title: string;
        selectMember: string;
        noMembers: string;
      };
      group: {
        title: string;
        titleLabel: string;
        titlePlaceholder: string;
        selectMembers: string;
        minMembers: string;
        create: string;
      };
      cancel: string;
      creating: string;
    };
    errors: {
      createChat: string;
    };
  };
  chats: ChatWithPreviewDTO[];
  loading: boolean;
  onChatSelected?: (chatId: string) => void;
}

export function ChatList({
  dict,
  chats,
  loading,
  onChatSelected,
}: ChatListProps) {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);
  const familyMembers = useAppSelector(selectFamilyMembers);
  const currentUser = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);
  const isAIIntegrationEnabled = useAppSelector(
    selectIsFeatureEnabled(currentFamily?.familyId, FeatureKey.AIIntegration),
  );
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  const handleChatSelect = (chatId: string) => {
    dispatch(selectChat(chatId));
    onChatSelected?.(chatId);
  };

  if (loading) {
    return <ChatListLoading />;
  }

  const getDisplayTitle = (chat: ChatWithPreviewDTO) => {
    // AI chats use their title (AI name from settings)
    if (chat.type === "ai") {
      return chat.title || "AI Assistant";
    }

    if (chat.type === "dm" && (!chat.title || !chat.title.trim())) {
      const otherMemberId = chat.memberIds.find((id) => id !== currentUser?.id);
      const member = familyMembers.find((m) => m.memberId === otherMemberId);
      if (member?.name) return member.name;
    }

    return (
      chat.title || (chat.type === "group" ? "Group Chat" : "Direct Message")
    );
  };

  // Filter chats based on feature availability
  const filteredChats = chats.filter((chat) => {
    // Hide AI chats if the feature is disabled
    if (chat.type === "ai" && !isAIIntegrationEnabled) {
      return false;
    }
    return true;
  });

  if (filteredChats.length === 0) {
    return <ChatListEmpty dict={dict} familyMembers={familyMembers} />;
  }

  return (
    <div className="flex h-full flex-col" data-testid="chat-list">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-lg font-semibold" data-testid="chat-list-title">
          {dict.chatList.title}
        </h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsNewChatOpen(true)}
          data-testid="new-chat-button"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 scroll-area-block">
        <div className="w-full space-y-1 p-2" data-testid="chat-list-items">
          {filteredChats.map((chat) => (
            <ChatListItem
              key={chat._id}
              chat={chat}
              displayTitle={getDisplayTitle(chat)}
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
