"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchChats,
  selectActiveChat,
  selectChat,
  selectChatLoading,
  selectChats,
} from "@/store/slices/chat.slice";
import { selectCurrentFamily } from "@/store/slices/family.slice";
import {
  selectAISettings,
  selectIsFeatureEnabled,
} from "@/store/slices/settings.slice";
import { ChatList } from "./chat-list";
import { ConversationView } from "./conversation-view";

interface ChatInterfaceProps {
  dict: {
    chatList: {
      title: string;
      emptyState: {
        title: string;
        description: string;
        action: string;
      };
    };
    tabs?: {
      chats: string;
      messages: string;
    };
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
    messageInput: {
      placeholder: string;
      shiftEnterHint: string;
      characterCount: string;
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
      fetchChats: string;
      retry: string;
      createChat: string;
      messageTooLong?: string;
      sendMessage: string;
    };
  };
  initialChatId?: string;
}

/**
 * Main chat interface component
 * Displays a two-column layout with chat list and conversation view
 * Real-time WebSocket events are handled by the global RealtimeProvider
 */
export function ChatInterface({ dict, initialChatId }: ChatInterfaceProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const chats = useAppSelector(selectChats);
  const activeChat = useAppSelector(selectActiveChat);
  const loading = useAppSelector(selectChatLoading);
  const currentFamily = useAppSelector(selectCurrentFamily);
  const familyId = currentFamily?.familyId;
  const aiSettings = useAppSelector(selectAISettings(familyId));
  const aiIntegrationEnabled = useAppSelector(
    selectIsFeatureEnabled(familyId, "aiIntegration"),
  );
  const lastFetch = useAppSelector((state) => state.chat.lastFetch);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [error, setError] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chats" | "messages">(
    initialChatId ? "messages" : "chats",
  );
  const [urlChatId, setUrlChatId] = useState<string | null>(() => {
    const paramId = searchParams?.get("chatId");
    return (paramId ?? initialChatId) || null;
  });

  const baseChatPath = useMemo(() => {
    const segments = pathname.split("/");
    const chatIndex = segments.indexOf("chat");
    if (chatIndex === -1) return pathname;
    const base = segments
      .slice(0, chatIndex + 1)
      .filter(Boolean)
      .join("/");
    return `/${base}`;
  }, [pathname]);

  const setChatIdInUrl = useCallback(
    (chatId?: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (chatId) {
        params.set("chatId", chatId);
      } else {
        params.delete("chatId");
      }

      const query = params.toString();
      router.replace(query ? `${baseChatPath}?${query}` : baseChatPath, {
        scroll: false,
      });
    },
    [baseChatPath, router, searchParams],
  );

  // 6.5rem = mobile header offset (pt-20) + page bottom padding (pb-6) to keep the chat view within the viewport

  // Fetch chats on mount
  useEffect(() => {
    // Only fetch on first mount when we don't have server-provided chats
    if (!lastFetch && !loading.chats) {
      dispatch(fetchChats({}))
        .unwrap()
        .catch((err) => {
          setError(err.message || dict.errors.fetchChats);
        });
    }
  }, [dispatch, lastFetch, loading.chats, dict.errors.fetchChats]);

  // Keep local urlChatId in sync with actual URL (e.g., back/forward nav)
  useEffect(() => {
    const paramId = searchParams?.get("chatId") ?? null;
    setUrlChatId(paramId ?? initialChatId ?? null);
  }, [searchParams, initialChatId]);

  // Auto-select chat when deep linked
  useEffect(() => {
    if (!urlChatId || activeChat?._id === urlChatId) return;
    const exists = chats.some((chat) => chat._id === urlChatId);
    if (exists) {
      dispatch(selectChat(urlChatId));
      setMobileTab("messages");
      setChatIdInUrl(urlChatId);
    }
  }, [urlChatId, chats, activeChat?._id, dispatch, setChatIdInUrl]);

  const handleChatSelected = (chatId: string) => {
    setUrlChatId(chatId);
    setChatIdInUrl(chatId);
    setMobileTab("messages");
  };

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

  // Show loading skeleton while determining layout to prevent hydration mismatch
  if (isDesktop === undefined) {
    return (
      <div
        className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col gap-2 md:h-[calc(100vh-4rem)]"
        data-testid="chat-interface"
      >
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100dvh-6.5rem)] min-h-0 flex-col gap-2 md:h-[calc(100vh-4rem)]"
      data-testid="chat-interface"
    >
      {/* Desktop & Tablet: two-column layout */}
      {isDesktop ? (
        <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
          <div className="w-[30%] min-w-[280px] max-w-[400px] border-r border-border">
            <ChatList
              dict={dict}
              chats={chats}
              loading={loading.chats}
              onChatSelected={handleChatSelected}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <ConversationView
              dict={dict}
              chat={activeChat}
              loading={loading.messages}
              aiName={aiSettings?.aiName}
              aiIntegrationEnabled={aiIntegrationEnabled}
            />
          </div>
        </div>
      ) : (
        <Tabs
          value={mobileTab}
          onValueChange={(val) => setMobileTab(val as "chats" | "messages")}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="chats">
              {dict.tabs?.chats ?? dict.chatList.title}
            </TabsTrigger>
            <TabsTrigger value="messages">
              {dict.tabs?.messages ?? "Messages"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="flex-1 overflow-hidden">
            <ChatList
              dict={dict}
              chats={chats}
              loading={loading.chats}
              onChatSelected={handleChatSelected}
            />
          </TabsContent>

          <TabsContent value="messages" className="flex-1 overflow-hidden">
            <ConversationView
              dict={dict}
              chat={activeChat}
              loading={loading.messages}
              aiName={aiSettings?.aiName}
              aiIntegrationEnabled={aiIntegrationEnabled}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
