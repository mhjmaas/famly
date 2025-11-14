import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type ObjectIdString, toObjectId } from "@lib/objectid-utils";
import type { FamilyMembership } from "@modules/family/domain/family";
import { emitToUserRooms } from "@modules/realtime";

/**
 * Event payload types for family member events
 */
export interface FamilyEventPayloads {
  "family.member.added": {
    familyId: string;
    memberId: string;
    name: string;
    role: "Parent" | "Child";
    affectedUsers: string[]; // User IDs to notify (all family members)
  };
  "family.member.removed": {
    familyId: string;
    memberId: string;
    name: string;
    affectedUsers: string[]; // User IDs to notify (all family members)
  };
  "family.member.role.updated": {
    familyId: string;
    memberId: string;
    name: string;
    oldRole: "Parent" | "Child";
    newRole: "Parent" | "Child";
    affectedUsers: string[]; // User IDs to notify (all family members)
  };
}

/**
 * Helper to get all family member IDs
 * Returns array of user IDs in the family (excluding the affected user for some events)
 *
 * @param familyId Family ID
 * @param excludeUserId Optional user ID to exclude from results
 * @returns Array of user ID strings
 */
async function getFamilyMemberIds(
  familyId: ObjectIdString,
  excludeUserId?: ObjectIdString,
): Promise<string[]> {
  try {
    const db = getDb();
    const membershipsCollection =
      db.collection<FamilyMembership>("family_memberships");

    const memberships = await membershipsCollection
      .find({ familyId: toObjectId(familyId, "familyId") })
      .toArray();

    let userIds = memberships.map((m) => m.userId.toString());

    if (excludeUserId) {
      userIds = userIds.filter((id) => id !== excludeUserId);
    }

    return userIds;
  } catch (error) {
    logger.error("Failed to get family member IDs:", error);
    return [];
  }
}

/**
 * Emit a family.member.added event
 * Broadcasts to all family members when a new member joins
 *
 * @param familyId The family ID
 * @param newMemberId The new member's user ID
 * @param memberName The new member's name
 * @param memberRole The new member's role
 */
export async function emitFamilyMemberAdded(
  familyId: ObjectIdString,
  newMemberId: ObjectIdString,
  memberName: string,
  memberRole: "Parent" | "Child",
): Promise<void> {
  try {
    // Get all family members to notify (including the new member)
    const affectedUsers = await getFamilyMemberIds(familyId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Family member ${newMemberId} added but no family members to notify`,
      );
      return;
    }

    const payload: FamilyEventPayloads["family.member.added"] = {
      familyId,
      memberId: newMemberId,
      name: memberName,
      role: memberRole,
      affectedUsers,
    };

    emitToUserRooms("family.member.added", affectedUsers, payload);

    logger.debug(`Emitted family.member.added event`, {
      familyId,
      newMemberId,
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit family.member.added event for family ${familyId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a family.member.removed event
 * Broadcasts to remaining family members when a member is removed
 *
 * @param familyId The family ID
 * @param removedMemberId The removed member's user ID
 * @param memberName The removed member's name
 */
export async function emitFamilyMemberRemoved(
  familyId: ObjectIdString,
  removedMemberId: ObjectIdString,
  memberName: string,
): Promise<void> {
  try {
    // Get all remaining family members (excluding the removed member)
    const affectedUsers = await getFamilyMemberIds(familyId, removedMemberId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Family member ${removedMemberId} removed but no users to notify`,
      );
      return;
    }

    const payload: FamilyEventPayloads["family.member.removed"] = {
      familyId,
      memberId: removedMemberId,
      name: memberName,
      affectedUsers,
    };

    emitToUserRooms("family.member.removed", affectedUsers, payload);

    logger.debug(`Emitted family.member.removed event`, {
      familyId,
      removedMemberId,
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit family.member.removed event for family ${familyId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a family.member.role.updated event
 * Broadcasts to all family members when a member's role changes
 *
 * @param familyId The family ID
 * @param memberId The member whose role changed
 * @param memberName The member's name
 * @param oldRole The previous role
 * @param newRole The new role
 */
export async function emitFamilyMemberRoleUpdated(
  familyId: ObjectIdString,
  memberId: ObjectIdString,
  memberName: string,
  oldRole: "Parent" | "Child",
  newRole: "Parent" | "Child",
): Promise<void> {
  try {
    // Get all family members to notify
    const affectedUsers = await getFamilyMemberIds(familyId);

    if (affectedUsers.length === 0) {
      logger.debug(
        `Family member ${memberId} role updated but no family members to notify`,
      );
      return;
    }

    const payload: FamilyEventPayloads["family.member.role.updated"] = {
      familyId,
      memberId,
      name: memberName,
      oldRole,
      newRole,
      affectedUsers,
    };

    emitToUserRooms("family.member.role.updated", affectedUsers, payload);

    logger.debug(`Emitted family.member.role.updated event`, {
      familyId,
      memberId,
      oldRole,
      newRole,
      affectedUsers,
    });
  } catch (error) {
    logger.error(
      `Failed to emit family.member.role.updated event for family ${familyId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
