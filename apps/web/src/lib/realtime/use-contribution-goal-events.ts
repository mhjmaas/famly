"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import { useAppDispatch } from "@/store/hooks";
import {
  clearGoal,
  fetchContributionGoal,
} from "@/store/slices/contribution-goals.slice";
import { fetchKarma } from "@/store/slices/karma.slice";
import type { ContributionGoalEventPayloads } from "./types";

export function useContributionGoalEvents(
  socket: Socket | null,
  familyId: string | null,
  enabled = true,
): void {
  const dispatch = useAppDispatch();
  const t = useNotificationTranslations();

  useEffect(() => {
    if (!socket || !familyId || !enabled) {
      return;
    }

    const refetchGoal = async (memberId: string) => {
      try {
        await dispatch(fetchContributionGoal({ familyId, memberId })).unwrap();
      } catch (error) {
        // Goal might not exist anymore (deleted or new week)
        console.warn("[Realtime] Failed to refetch contribution goal:", error);
        dispatch(clearGoal(memberId));
      }
    };

    const handleDeducted = async (
      event: ContributionGoalEventPayloads["contribution_goal.deducted"],
    ) => {
      if (event.familyId !== familyId) return;
      await refetchGoal(event.memberId);
    };

    const handleAwarded = async (
      event: ContributionGoalEventPayloads["contribution_goal.awarded"],
    ) => {
      if (event.familyId !== familyId) return;
      const memberName = (event as { memberName?: string }).memberName ?? "";
      toast.success(t.contributionGoal.awarded, {
        description: t.contributionGoal.awardedDescription
          .replace("{memberName}", memberName)
          .replace("{amount}", event.karmaAwarded.toString()),
      });
      await refetchGoal(event.memberId);
      dispatch(fetchKarma({ familyId, userId: event.memberId }));
    };

    const handleUpdated = async (
      event: ContributionGoalEventPayloads["contribution_goal.updated"],
    ) => {
      if (event.familyId !== familyId) return;

      if (event.action === "DELETED") {
        dispatch(clearGoal(event.memberId));
        return;
      }

      await refetchGoal(event.memberId);
    };

    socket.on("contribution_goal.deducted", handleDeducted);
    socket.on("contribution_goal.awarded", handleAwarded);
    socket.on("contribution_goal.updated", handleUpdated);

    return () => {
      socket.off("contribution_goal.deducted", handleDeducted);
      socket.off("contribution_goal.awarded", handleAwarded);
      socket.off("contribution_goal.updated", handleUpdated);
    };
  }, [socket, familyId, enabled, dispatch, t]);
}
