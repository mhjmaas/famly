import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import type { FamilyMembership } from "@modules/family/domain/family";
import { emitToUserRooms } from "@modules/realtime";
import type { ObjectId } from "mongodb";
import type { RewardClaim } from "../domain/reward";

/**
 * Event payload types for reward events
 */
export interface RewardEventPayloads {
  "claim.created": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    autoTaskId?: string;
    claim: RewardClaim;
  };
  "claim.completed": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    completedBy: string;
    claim: RewardClaim;
  };
  "claim.cancelled": {
    claimId: string;
    rewardId: string;
    familyId: string;
    memberId: string;
    cancelledBy: string;
    claim: RewardClaim;
  };
  "approval_task.created": {
    taskId: string;
    claimId: string;
    rewardId: string;
    familyId: string;
    assignedToParents: boolean;
  };
  "reward.created": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
  "reward.updated": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
  "reward.deleted": {
    rewardId: string;
    familyId: string;
    name: string;
    affectedUsers: string[];
  };
}

/**
 * Helper to get all family member user IDs
 * Returns array of user IDs in the family
 */
async function getFamilyMemberIds(familyId: ObjectId): Promise<string[]> {
  const db = getDb();
  const membershipsCollection =
    db.collection<FamilyMembership>("family_memberships");

  const memberships = await membershipsCollection.find({ familyId }).toArray();

  return memberships.map((m) => m.userId.toString());
}

/**
 * Emit a claim.created event
 * Broadcasts when a new reward claim is created
 *
 * @param claim The created claim
 * @param parentUserIds Optional array of parent user IDs to notify
 */
export function emitClaimCreated(
  claim: RewardClaim,
  parentUserIds?: string[],
): void {
  try {
    // Notify the member who created the claim
    const targetUserIds = [claim.memberId.toString()];

    // Also notify parents if provided (they need to approve the claim)
    if (parentUserIds && parentUserIds.length > 0) {
      targetUserIds.push(...parentUserIds);
    }

    const payload: RewardEventPayloads["claim.created"] = {
      claimId: claim._id.toString(),
      rewardId: claim.rewardId.toString(),
      familyId: claim.familyId.toString(),
      memberId: claim.memberId.toString(),
      autoTaskId: claim.autoTaskId?.toString(),
      claim,
    };

    emitToUserRooms("claim.created", targetUserIds, payload);

    logger.debug(`Emitted claim.created event for claim ${claim._id}`, {
      claimId: claim._id.toString(),
      targetUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit claim.created event for claim ${claim._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit an approval_task.created event
 * Broadcasts when an approval task is created for a reward claim
 *
 * @param taskId The created task ID
 * @param claim The claim that triggered the task creation
 * @param parentUserIds Array of parent user IDs to notify
 */
export function emitApprovalTaskCreated(
  taskId: string,
  claim: RewardClaim,
  parentUserIds: string[],
): void {
  try {
    if (parentUserIds.length === 0) {
      logger.debug(`Approval task ${taskId} created but no parents to notify`);
      return;
    }

    const payload: RewardEventPayloads["approval_task.created"] = {
      taskId,
      claimId: claim._id.toString(),
      rewardId: claim.rewardId.toString(),
      familyId: claim.familyId.toString(),
      assignedToParents: true,
    };

    emitToUserRooms("approval_task.created", parentUserIds, payload);

    logger.debug(`Emitted approval_task.created event for task ${taskId}`, {
      taskId,
      claimId: claim._id.toString(),
      targetUserIds: parentUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit approval_task.created event for task ${taskId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a claim.completed event
 * Broadcasts when a reward claim is completed
 *
 * @param claim The completed claim
 * @param completedBy User ID who completed the claim
 */
export function emitClaimCompleted(
  claim: RewardClaim,
  completedBy: string,
): void {
  try {
    // Notify the member whose claim was completed
    const targetUserIds = [claim.memberId.toString()];

    // Also notify the parent who completed it
    if (completedBy !== claim.memberId.toString()) {
      targetUserIds.push(completedBy);
    }

    const payload: RewardEventPayloads["claim.completed"] = {
      claimId: claim._id.toString(),
      rewardId: claim.rewardId.toString(),
      familyId: claim.familyId.toString(),
      memberId: claim.memberId.toString(),
      completedBy,
      claim,
    };

    emitToUserRooms("claim.completed", targetUserIds, payload);

    logger.debug(`Emitted claim.completed event for claim ${claim._id}`, {
      claimId: claim._id.toString(),
      completedBy,
      targetUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit claim.completed event for claim ${claim._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a claim.cancelled event
 * Broadcasts when a reward claim is cancelled
 *
 * @param claim The cancelled claim
 * @param cancelledBy User ID who cancelled the claim
 */
export function emitClaimCancelled(
  claim: RewardClaim,
  cancelledBy: string,
): void {
  try {
    // Notify the member whose claim was cancelled
    const targetUserIds = [claim.memberId.toString()];

    // Also notify the user who cancelled it (if different)
    if (cancelledBy !== claim.memberId.toString()) {
      targetUserIds.push(cancelledBy);
    }

    const payload: RewardEventPayloads["claim.cancelled"] = {
      claimId: claim._id.toString(),
      rewardId: claim.rewardId.toString(),
      familyId: claim.familyId.toString(),
      memberId: claim.memberId.toString(),
      cancelledBy,
      claim,
    };

    emitToUserRooms("claim.cancelled", targetUserIds, payload);

    logger.debug(`Emitted claim.cancelled event for claim ${claim._id}`, {
      claimId: claim._id.toString(),
      cancelledBy,
      targetUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit claim.cancelled event for claim ${claim._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a reward.created event
 * Broadcasts to all family members when a new reward is created
 *
 * @param rewardId The created reward ID
 * @param familyId The family ID
 * @param name The reward name
 */
export async function emitRewardCreated(
  rewardId: ObjectId,
  familyId: ObjectId,
  name: string,
): Promise<void> {
  try {
    const affectedUsers = await getFamilyMemberIds(familyId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Reward ${rewardId} created but no family members to notify`,
      );
      return;
    }

    const payload: RewardEventPayloads["reward.created"] = {
      rewardId: rewardId.toString(),
      familyId: familyId.toString(),
      name,
      affectedUsers,
    };

    emitToUserRooms("reward.created", affectedUsers, payload);

    logger.debug(`Emitted reward.created event for reward ${rewardId}`, {
      rewardId: rewardId.toString(),
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit reward.created event for reward ${rewardId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a reward.updated event
 * Broadcasts to all family members when a reward is updated
 *
 * @param rewardId The updated reward ID
 * @param familyId The family ID
 * @param name The reward name
 */
export async function emitRewardUpdated(
  rewardId: ObjectId,
  familyId: ObjectId,
  name: string,
): Promise<void> {
  try {
    const affectedUsers = await getFamilyMemberIds(familyId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Reward ${rewardId} updated but no family members to notify`,
      );
      return;
    }

    const payload: RewardEventPayloads["reward.updated"] = {
      rewardId: rewardId.toString(),
      familyId: familyId.toString(),
      name,
      affectedUsers,
    };

    emitToUserRooms("reward.updated", affectedUsers, payload);

    logger.debug(`Emitted reward.updated event for reward ${rewardId}`, {
      rewardId: rewardId.toString(),
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit reward.updated event for reward ${rewardId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a reward.deleted event
 * Broadcasts to all family members when a reward is deleted
 *
 * @param rewardId The deleted reward ID
 * @param familyId The family ID
 * @param name The reward name
 */
export async function emitRewardDeleted(
  rewardId: ObjectId,
  familyId: ObjectId,
  name: string,
): Promise<void> {
  try {
    const affectedUsers = await getFamilyMemberIds(familyId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Reward ${rewardId} deleted but no family members to notify`,
      );
      return;
    }

    const payload: RewardEventPayloads["reward.deleted"] = {
      rewardId: rewardId.toString(),
      familyId: familyId.toString(),
      name,
      affectedUsers,
    };

    emitToUserRooms("reward.deleted", affectedUsers, payload);

    logger.debug(`Emitted reward.deleted event for reward ${rewardId}`, {
      rewardId: rewardId.toString(),
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit reward.deleted event for reward ${rewardId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
