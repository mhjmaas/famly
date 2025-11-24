"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import { formatActivityFromTemplate } from "@/lib/utils/activity-utils";
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
  const t = useNotificationTranslations();

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

        const localized = event.templateKey
          ? formatActivityFromTemplate(event, t)
          : null;

        // Show notification based on activity type
        switch (event.type) {
          case "TASK":
            toast.success(
              localized?.title ??
                t.activity.task.completedTitle ??
                "Task Completed",
              {
                description: localized?.description ?? event.title,
              },
            );
            break;
          case "KARMA":
            toast.success(
              localized?.title ??
                t.activity.karma.awardedTitle ??
                "Karma Awarded",
              {
                description:
                  localized?.description ??
                  `${event.title}${event.metadata?.karma ? ` (+${event.metadata.karma})` : ""}`,
              },
            );
            break;
          case "REWARD":
            toast.success(
              localized?.title ??
                t.activity.reward.claimedTitle ??
                "Reward Claimed",
              {
                description: localized?.description ?? event.title,
              },
            );
            break;
          case "CONTRIBUTION_GOAL": {
            const amount = event.metadata?.karma ?? 0;
            const absAmount = Math.abs(amount);
            const isDeduction = event.detail === "DEDUCTED" || amount < 0;
            if (isDeduction) {
              toast.info(
                localized?.title ??
                  t.activity.contributionGoal.deductedTitle ??
                  "Deduction Applied",
                {
                  description:
                    localized?.description ??
                    t.contributionGoal.deductedDescription
                      .replace("{memberName}", "")
                      .replace("{amount}", absAmount.toString()),
                },
              );
            } else {
              toast.success(
                localized?.title ??
                  t.activity.contributionGoal.awardedTitle ??
                  "Goal Achieved",
                {
                  description:
                    localized?.description ??
                    t.contributionGoal.awardedDescription
                      .replace("{memberName}", "")
                      .replace("{amount}", absAmount.toString()),
                },
              );
            }
            break;
          }
          default:
            toast.info(localized?.title ?? "Activity Recorded", {
              description: localized?.description ?? event.title,
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
  }, [socket, userId, enabled, dispatch, t]);
}
