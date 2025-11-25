"use client";

import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatExactTime } from "@/lib/utils/chat-utils";
import { getInitials } from "@/lib/utils/family-utils";
import { cn } from "@/lib/utils/style-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMessages,
  selectMessagesForChat,
} from "@/store/slices/chat.slice";
import { selectFamilyMembers } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { ChatWithPreviewDTO, MessageDTO } from "@/types/api.types";
import { MessageInput } from "./message-input";

interface ConversationViewProps {
  dict: {
    conversation: {
      emptyState: {
        title: string;
        description: string;
      };
      noMessages: {
        title: string;
        description: string;
      };
      loading: string;
    };
  };
  chat: ChatWithPreviewDTO | null;
  loading: boolean;
}

export function ConversationView({
  dict,
  chat,
  loading,
}: ConversationViewProps) {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const familyMembers = useAppSelector(selectFamilyMembers);
  const messages = useAppSelector((state) =>
    chat ? selectMessagesForChat(state, chat._id) : [],
  );

  // Fetch messages when chat changes
  useEffect(() => {
    if (chat) {
      dispatch(fetchMessages({ chatId: chat._id }));
    }
  }, [chat, dispatch]);

  // Helper to get sender initials
  const getSenderInitials = (message: MessageDTO): string => {
    // Check if this is the current user's message
    if (message.senderId === currentUser?.id) {
      // Use current user's name for their own messages
      if (currentUser?.name) {
        return getInitials(currentUser.name);
      }
      return "ME";
    }

    // For other users, look up in family members
    const member = familyMembers.find((m) => m.memberId === message.senderId);
    if (member?.name) {
      return getInitials(member.name);
    }

    // Fallback: unknown user
    return "?";
  };

  // Helper to check if avatar should be shown
  const shouldShowAvatar = (message: MessageDTO, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    if (prevMessage.senderId !== message.senderId) return true;
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(prevMessage.createdAt).getTime();
    return timeDiff > 300000; // 5 minutes
  };

  if (!chat) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <MessageCircle className="h-16 w-16 text-muted-foreground" />
        <div>
          <h3 className="text-lg font-medium">
            {dict.conversation.emptyState.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {dict.conversation.emptyState.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Chat Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">
          {chat.title || "Direct Message"}
        </h2>
      </div>

      {/* Messages using AI Elements Conversation */}
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.length === 0 && !loading ? (
            <ConversationEmptyState
              description={dict.conversation.noMessages.description}
              icon={<MessageCircle className="size-6" />}
              title={dict.conversation.noMessages.title}
            />
          ) : loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">
                {dict.conversation.loading}
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUser?.id;
              const showAvatar = shouldShowAvatar(message, index);

              return (
                <div
                  key={message._id}
                  className={cn(
                    "flex gap-2",
                    isOwnMessage ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>
                        {getSenderInitials(message)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8 shrink-0" />
                  )}

                  {/* Message using AI Elements */}
                  <Message from={isOwnMessage ? "user" : "assistant"}>
                    <MessageContent>{message.body}</MessageContent>
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
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <MessageInput chatId={chat._id} dict={dict} />
      </div>
    </div>
  );
}
