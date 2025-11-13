"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useAppDispatch } from "@/store/hooks";
import { fetchActivityEvents } from "@/store/slices/activities.slice";
import type { ActivityEventPayloads } from "./types";

/**
 * Hook for subscribing to activity realtime events
 * Notifies user when new activities are recorded (task completion, karma grants, etc.)
 * Automatically refreshes the activity list when new activities are created
 *
 * @param socket Socket.IO instance
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useActivityEvents(
  socket: Socket | null,
  userId: string | null,
  enabled = true,
): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!socket || !userId || !enabled) {
      return;
    }

    // Handler for activity.created event
    const handleActivityCreated = (
      event: ActivityEventPayloads["activity.created"],
    ) => {
      // Only show notification if this is the current user's activity
      if (event.userId === userId) {
        console.log("[Realtime] Activity created:", event.title);

        // Show notification based on activity type
        switch (event.type) {
          case "TASK":
            toast.success("Task Completed", {
              description: event.title,
            });
            break;
          case "KARMA":
            toast.success("Karma Awarded", {
              description: `${event.title}${event.metadata?.karma ? ` (+${event.metadata.karma})` : ""}`,
            });
            break;
          case "REWARD":
            toast.success("Reward Claimed", {
              description: event.title,
            });
            break;
          default:
            toast.info("Activity Recorded", {
              description: event.title,
            });
        }

        // Refresh the activity list to show new activity
        dispatch(fetchActivityEvents());
      }
    };

    // Subscribe to activity events
    socket.on("activity.created", handleActivityCreated);

    // Cleanup
    return () => {
      socket.off("activity.created", handleActivityCreated);
    };
  }, [socket, userId, enabled, dispatch]);
}
