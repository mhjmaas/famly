"use client";

import { MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { FamilyMember } from "@/types/api.types";
import { NewChatDialog } from "./new-chat-dialog";

interface ChatListEmptyProps {
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
  familyMembers: readonly FamilyMember[];
}

export function ChatListEmpty({ dict, familyMembers }: ChatListEmptyProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  return (
    <div className="flex h-full flex-col" data-testid="chat-list">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold" data-testid="chat-list-title">
          {dict.chatList.title}
        </h2>
      </div>
      <div
        className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
        data-testid="chat-list-empty"
      >
        <MessageSquarePlus className="h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-medium">{dict.chatList.emptyState.title}</h3>
          <p className="text-sm text-muted-foreground">
            {dict.chatList.emptyState.description}
          </p>
        </div>
        <Button
          onClick={() => setIsNewChatOpen(true)}
          data-testid="new-chat-button"
        >
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
