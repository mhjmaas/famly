"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addMessageFromEvent,
  fetchChats,
  fetchMessages,
  selectActiveChatId,
  updateChatFromEvent,
} from "@/store/slices/chat.slice";
import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import type { ChatEventPayloads } from "./types";

/**
 * Hook for subscribing to chat-related realtime events
 * Handles message:new, chat:update, receipt:update events
 *
 * @param socket Socket.IO instance
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useChatEvents(
  socket: Socket | null,
  userId: string | null,
  enabled = true,
): void {
  const dispatch = useAppDispatch();
  const activeChatId = useAppSelector(selectActiveChatId);

  // Join/leave chat rooms when active chat changes
  useEffect(() => {
    if (!socket || !activeChatId || !enabled) {
      return;
    }

    console.log(`[Realtime] Joining chat room: ${activeChatId}`);

    // Join the chat room
    socket.emit("room:join", { chatId: activeChatId }, (response: any) => {
      if (response.ok) {
        console.log(
          `[Realtime] Successfully joined chat room: ${activeChatId}`,
        );
      } else {
        console.error(
          `[Realtime] Failed to join chat room: ${response.message}`,
        );
      }
    });

    // Leave room on cleanup or when chat changes
    return () => {
      console.log(`[Realtime] Leaving chat room: ${activeChatId}`);
      socket.emit("room:leave", { chatId: activeChatId });
    };
  }, [socket, activeChatId, enabled]);

  // Subscribe to chat events
  useEffect(() => {
    if (!socket || !userId || !enabled) {
      return;
    }

    console.log("[Realtime] Subscribing to chat events");

    // Handler for message:new event (received when user is viewing the chat room)
    const handleMessageNew = (event: ChatEventPayloads["message:new"]) => {
      console.log("[Realtime] New message received:", event.message._id);

      // Add message to Redux store
      dispatch(addMessageFromEvent(event.message));

      // If this is the active chat, emit read receipt
      if (activeChatId === event.chatId) {
        socket.emit("receipt:read", {
          chatId: event.chatId,
          messageId: event.message._id,
        });
      }
    };

    // Handler for message:notification event (received via user room for all chats)
    // This handles messages in chats the user is NOT currently viewing
    const handleMessageNotification = (
      event: ChatEventPayloads["message:notification"],
    ) => {
      // Only process if this is NOT the active chat (to avoid duplicates with message:new)
      if (activeChatId !== event.chatId) {
        console.log(
          "[Realtime] Message notification received for chat:",
          event.chatId,
        );

        // Add message to Redux store (this will increment unread count)
        dispatch(addMessageFromEvent(event.message));
      }
    };

    // Handler for chat:update event
    const handleChatUpdate = (event: ChatEventPayloads["chat:update"]) => {
      console.log("[Realtime] Chat updated:", event.chat._id);

      // Update chat in Redux store
      dispatch(updateChatFromEvent(event.chat));
    };

    // Handler for receipt:update event
    const handleReceiptUpdate = (
      event: ChatEventPayloads["receipt:update"],
    ) => {
      console.log("[Realtime] Receipt updated:", event.messageId);

      // TODO: Update read receipts in Redux store
      // For now, this is a placeholder for future read receipt UI
    };

    // Handler for connection/reconnection
    const handleReconnect = () => {
      console.log("[Realtime] Reconnected - refetching chats");

      // Refetch chats to ensure we're in sync
      dispatch(fetchChats({}));

      // Refetch messages for active chat if one is selected
      if (activeChatId) {
        dispatch(fetchMessages({ chatId: activeChatId }));
      }
    };

    // Subscribe to events
    socket.on("message:new", handleMessageNew);
    socket.on("message:notification", handleMessageNotification);
    socket.on("chat:update", handleChatUpdate);
    socket.on("receipt:update", handleReceiptUpdate);
    socket.on("reconnect", handleReconnect);

    // Cleanup
    return () => {
      console.log("[Realtime] Unsubscribing from chat events");
      socket.off("message:new", handleMessageNew);
      socket.off("message:notification", handleMessageNotification);
      socket.off("chat:update", handleChatUpdate);
      socket.off("receipt:update", handleReceiptUpdate);
      socket.off("reconnect", handleReconnect);
    };
  }, [socket, userId, enabled, dispatch, activeChatId]);
}
