"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import { useAppDispatch } from "@/store/hooks";
import { fetchKarma } from "@/store/slices/karma.slice";
import type { KarmaEventPayloads } from "./types";

/**
 * Hook for subscribing to karma-related realtime events
 * Handles karma.awarded and karma.deducted events
 *
 * @param socket Socket.IO instance
 * @param familyId Current family ID
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useKarmaEvents(
  socket: Socket | null,
  familyId: string | null,
  userId: string | null,
  enabled = true,
): void {
  const dispatch = useAppDispatch();
  const t = useNotificationTranslations();

  useEffect(() => {
    if (!socket || !familyId || !userId || !enabled) {
      return;
    }

    // Handler for karma.awarded event
    const handleKarmaAwarded = (event: KarmaEventPayloads["karma.awarded"]) => {
      console.log("[Realtime] Karma awarded:", event.amount);

      // Only handle events for the current user
      if (event.userId !== userId) {
        return;
      }

      // Refresh karma balance from server
      dispatch(fetchKarma({ familyId, userId }));

      // Show notification with translations
      const description = event.description ? `: ${event.description}` : "";
      toast.success(t.karma.awarded, {
        description: t.karma.awardedDescription
          .replace("{amount}", event.amount.toString())
          .replace("{description}", description),
        duration: 4000,
      });
    };

    // Handler for karma.deducted event
    const handleKarmaDeducted = (
      event: KarmaEventPayloads["karma.deducted"],
    ) => {
      console.log("[Realtime] Karma deducted:", event.amount);

      // Only handle events for the current user
      if (event.userId !== userId) {
        return;
      }

      // Refresh karma balance from server
      dispatch(fetchKarma({ familyId, userId }));

      // Show notification with translations
      const description = event.description ? `: ${event.description}` : "";
      toast.info(t.karma.deducted, {
        description: t.karma.deductedDescription
          .replace("{amount}", event.amount.toString())
          .replace("{description}", description),
        duration: 4000,
      });
    };

    // Subscribe to events
    socket.on("karma.awarded", handleKarmaAwarded);
    socket.on("karma.deducted", handleKarmaDeducted);

    // Cleanup
    return () => {
      socket.off("karma.awarded", handleKarmaAwarded);
      socket.off("karma.deducted", handleKarmaDeducted);
    };
  }, [socket, familyId, userId, enabled, dispatch, t]);
}
