"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import { useAppDispatch } from "@/store/hooks";
import { fetchClaims } from "@/store/slices/claims.slice";
import { fetchKarma } from "@/store/slices/karma.slice";
import { fetchRewards } from "@/store/slices/rewards.slice";
import { fetchTasks } from "@/store/slices/tasks.slice";
import type { RewardEventPayloads } from "./types";

/**
 * Hook for subscribing to reward-related realtime events
 * Handles:
 * - Claim events: claim.created, claim.completed, claim.cancelled, approval_task.created
 * - Reward CRUD events: reward.created, reward.updated, reward.deleted
 *
 * @param socket Socket.IO instance
 * @param familyId Current family ID
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useRewardEvents(
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

    // Handler for claim.created event
    const handleClaimCreated = (
      event: RewardEventPayloads["claim.created"],
    ) => {
      console.log("[Realtime] Claim created:", event.claimId);

      // Refresh rewards and claims
      dispatch(fetchRewards(familyId));
      dispatch(fetchClaims(familyId));

      // Show notification if it's the current user's claim
      if (event.memberId === userId) {
        const rewardName = event.rewardName ?? "";
        toast.success(t.reward.claimed, {
          description: t.reward.claimedDescription.replace(
            "{rewardName}",
            rewardName,
          ),
        });
      }
    };

    // Handler for approval_task.created event
    const handleApprovalTaskCreated = (
      event: RewardEventPayloads["approval_task.created"],
    ) => {
      console.log("[Realtime] Approval task created:", event.taskId);

      // Refresh tasks to show new approval task
      dispatch(fetchTasks(familyId));

      // Parents receive notification about pending approval
      if (event.assignedToParents) {
        const rewardName = (event as { rewardName?: string }).rewardName ?? "";
        const memberName = (event as { memberName?: string }).memberName ?? "";
        toast.info(t.reward.approvalTaskCreated, {
          description: t.reward.approvalTaskCreatedDescription
            .replace("{memberName}", memberName)
            .replace("{rewardName}", rewardName),
        });
      }
    };

    // Handler for claim.completed event
    const handleClaimCompleted = (
      event: RewardEventPayloads["claim.completed"],
    ) => {
      console.log("[Realtime] Claim completed:", event.claimId);

      // Refresh claims and rewards
      dispatch(fetchClaims(familyId));
      dispatch(fetchRewards(familyId));

      // Refresh karma if it's the current user's claim
      if (event.memberId === userId) {
        dispatch(fetchKarma({ familyId, userId }));

        const rewardName = event.rewardName ?? "";
        toast.success(t.reward.completed, {
          description: t.reward.completedDescription.replace(
            "{rewardName}",
            rewardName,
          ),
        });
      }
    };

    // Handler for claim.cancelled event
    const handleClaimCancelled = (
      event: RewardEventPayloads["claim.cancelled"],
    ) => {
      console.log("[Realtime] Claim cancelled:", event.claimId);

      // Refresh claims and rewards
      dispatch(fetchClaims(familyId));
      dispatch(fetchRewards(familyId));

      // Refresh karma if it's the current user's claim (karma refunded)
      if (event.memberId === userId) {
        dispatch(fetchKarma({ familyId, userId }));

        const rewardName = event.rewardName ?? "";
        toast.info(t.reward.cancelled, {
          description: t.reward.cancelledDescription.replace(
            "{rewardName}",
            rewardName,
          ),
        });
      }
    };

    // Handler for reward.created event
    const handleRewardCreated = (
      event: RewardEventPayloads["reward.created"],
    ) => {
      console.log("[Realtime] Reward created:", event.name);

      // Refresh rewards list
      dispatch(fetchRewards(familyId));

      // Show notification
      toast.success(t.reward.created, {
        description: t.reward.createdDescription.replace(
          "{rewardName}",
          event.name,
        ),
      });
    };

    // Handler for reward.updated event
    const handleRewardUpdated = (
      event: RewardEventPayloads["reward.updated"],
    ) => {
      console.log("[Realtime] Reward updated:", event.name);

      // Refresh rewards list
      dispatch(fetchRewards(familyId));

      // Show notification (using generic updated message)
      toast.info(t.reward.updated, {
        description: t.reward.updatedDescription.replace(
          "{rewardName}",
          event.name,
        ),
      });
    };

    // Handler for reward.deleted event
    const handleRewardDeleted = (
      event: RewardEventPayloads["reward.deleted"],
    ) => {
      console.log("[Realtime] Reward deleted:", event.name);

      // Refresh rewards list
      dispatch(fetchRewards(familyId));

      // Show notification (using generic deleted message)
      toast.info(t.reward.deleted, {
        description: t.reward.deletedDescription.replace(
          "{rewardName}",
          event.name,
        ),
      });
    };

    // Subscribe to events
    socket.on("claim.created", handleClaimCreated);
    socket.on("approval_task.created", handleApprovalTaskCreated);
    socket.on("claim.completed", handleClaimCompleted);
    socket.on("claim.cancelled", handleClaimCancelled);
    socket.on("reward.created", handleRewardCreated);
    socket.on("reward.updated", handleRewardUpdated);
    socket.on("reward.deleted", handleRewardDeleted);

    // Cleanup
    return () => {
      socket.off("claim.created", handleClaimCreated);
      socket.off("approval_task.created", handleApprovalTaskCreated);
      socket.off("claim.completed", handleClaimCompleted);
      socket.off("claim.cancelled", handleClaimCancelled);
      socket.off("reward.created", handleRewardCreated);
      socket.off("reward.updated", handleRewardUpdated);
      socket.off("reward.deleted", handleRewardDeleted);
    };
  }, [socket, familyId, userId, enabled, dispatch, t]);
}
