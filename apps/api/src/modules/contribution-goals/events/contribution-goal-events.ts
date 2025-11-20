import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId } from "@lib/objectid-utils";
import type { FamilyMembership } from "@modules/family/domain/family";
import { emitToUserRooms } from "@modules/realtime";
import type {
  ContributionGoal,
  ContributionGoalDTO,
  Deduction,
} from "../domain/contribution-goal";
import {
  toContributionGoalDTO,
  toDeductionDTO,
} from "../lib/contribution-goal.mapper";

/**
 * Event payload types for contribution goal events
 */
export interface ContributionGoalEventPayloads {
  "contribution_goal.deducted": {
    goalId: string;
    familyId: string;
    memberId: string;
    goal: ContributionGoalDTO;
    deduction: {
      _id: string;
      amount: number;
      reason: string;
      deductedBy: string;
      createdAt: string;
    };
  };
  "contribution_goal.awarded": {
    goalId: string;
    familyId: string;
    memberId: string;
    karmaAwarded: number;
    goalTitle: string;
  };
  "contribution_goal.updated": {
    goalId: string;
    familyId: string;
    memberId: string;
    action: "CREATED" | "UPDATED" | "DELETED";
    goal?: ContributionGoalDTO;
  };
}

/**
 * Helper to get all family member user IDs
 * Converts familyId string to ObjectId for proper MongoDB query matching
 */
async function getFamilyMemberIds(familyId: string): Promise<string[]> {
  const db = getDb();
  const membershipsCollection =
    db.collection<FamilyMembership>("family_memberships");

  const memberships = await membershipsCollection
    .find({ familyId: toObjectId(familyId, "familyId") })
    .toArray();

  return memberships.map((m) => m.userId.toString());
}

/**
 * Emit a contribution_goal.deducted event
 * Broadcasts to all family members when a deduction is added
 */
export async function emitContributionGoalDeducted(
  goal: ContributionGoal,
  deduction: Deduction,
): Promise<void> {
  try {
    const familyMemberIds = await getFamilyMemberIds(goal.familyId.toString());

    if (familyMemberIds.length === 0) {
      logger.debug(
        `Contribution goal ${goal._id} deduction event has no family members to notify`,
      );
      return;
    }

    const payload: ContributionGoalEventPayloads["contribution_goal.deducted"] =
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
        goal: toContributionGoalDTO(goal),
        deduction: toDeductionDTO(deduction),
      };

    emitToUserRooms("contribution_goal.deducted", familyMemberIds, payload);

    logger.debug(
      `Emitted contribution_goal.deducted event for goal ${goal._id}`,
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
      },
    );
  } catch (error) {
    logger.error(
      `Failed to emit contribution_goal.deducted event for goal ${goal._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a contribution_goal.awarded event
 * Broadcasts to all family members when weekly karma is awarded
 */
export async function emitContributionGoalAwarded(
  goal: ContributionGoal,
  karmaAwarded: number,
): Promise<void> {
  try {
    const familyMemberIds = await getFamilyMemberIds(goal.familyId.toString());

    if (familyMemberIds.length === 0) {
      logger.debug(
        `Contribution goal ${goal._id} awarded event has no family members to notify`,
      );
      return;
    }

    const payload: ContributionGoalEventPayloads["contribution_goal.awarded"] =
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
        karmaAwarded,
        goalTitle: goal.title,
      };

    emitToUserRooms("contribution_goal.awarded", familyMemberIds, payload);

    logger.debug(
      `Emitted contribution_goal.awarded event for goal ${goal._id}`,
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
        karmaAwarded,
      },
    );
  } catch (error) {
    logger.error(
      `Failed to emit contribution_goal.awarded event for goal ${goal._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a contribution_goal.updated event
 * Broadcasts to all family members when a goal is created, updated, or deleted
 */
export async function emitContributionGoalUpdated(
  goal: ContributionGoal,
  action: "CREATED" | "UPDATED" | "DELETED",
): Promise<void> {
  try {
    const familyMemberIds = await getFamilyMemberIds(goal.familyId.toString());

    if (familyMemberIds.length === 0) {
      logger.debug(
        `Contribution goal ${goal._id} updated event has no family members to notify`,
      );
      return;
    }

    const payload: ContributionGoalEventPayloads["contribution_goal.updated"] =
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
        action,
        goal: action !== "DELETED" ? toContributionGoalDTO(goal) : undefined,
      };

    emitToUserRooms("contribution_goal.updated", familyMemberIds, payload);

    logger.debug(
      `Emitted contribution_goal.updated event for goal ${goal._id}`,
      {
        goalId: goal._id.toString(),
        familyId: goal.familyId.toString(),
        memberId: goal.memberId.toString(),
        action,
      },
    );
  } catch (error) {
    logger.error(
      `Failed to emit contribution_goal.updated event for goal ${goal._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
