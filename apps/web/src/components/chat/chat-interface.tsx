"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchChats,
  selectActiveChat,
  selectChatLoading,
  selectChats,
} from "@/store/slices/chat.slice";
import { ChatList } from "./chat-list";
import { ConversationView } from "./conversation-view";

interface ChatInterfaceProps {
  dict: {
    errors: {
      fetchChats: string;
      retry: string;
    };
  };
}

/**
 * Main chat interface component
 * Displays a two-column layout with chat list and conversation view
 * Real-time WebSocket events are handled by the global RealtimeProvider
 */
export function ChatInterface({ dict }: ChatInterfaceProps) {
  const dispatch = useAppDispatch();
  const chats = useAppSelector(selectChats);
  const activeChat = useAppSelector(selectActiveChat);
  const loading = useAppSelector(selectChatLoading);
  const [error, setError] = useState<string | null>(null);

  // Fetch chats on mount
  useEffect(() => {
    if (!chats.length && !loading.chats) {
      dispatch(fetchChats({}))
        .unwrap()
        .catch((err) => {
          setError(err.message || dict.errors.fetchChats);
        });
    }
  }, [chats.length, dispatch, loading.chats, dict.errors.fetchChats]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                dispatch(fetchChats({}));
              }}
            >
              {dict.errors.retry}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col gap-2">
      {/* Main Chat Interface */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Chat List - 30% width */}
        <div className="w-[30%] min-w-[280px] max-w-[400px] border-r border-border">
          <ChatList dict={dict} chats={chats} loading={loading.chats} />
        </div>

        {/* Conversation View - 70% width */}
        <div className="flex-1 overflow-hidden">
          <ConversationView
            dict={dict}
            chat={activeChat}
            loading={loading.messages}
          />
        </div>
      </div>
    </div>
  );
}
