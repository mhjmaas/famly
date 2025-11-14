import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import type { FamilyMembership } from "@modules/family/domain/family";
import { emitToUserRooms } from "@modules/realtime";
import type { ObjectId } from "mongodb";
import type { Task, TaskDTO } from "../domain/task";
import { toTaskDTO } from "../lib/task.mapper";

/**
 * Event payload types for task events
 * Uses TaskDTO to ensure proper serialization (no ObjectId or Date objects)
 */
export interface TaskEventPayloads {
  "task.created": {
    taskId: string;
    familyId: string;
    assignedTo: string[]; // User IDs to notify
    task: TaskDTO;
  };
  "task.assigned": {
    taskId: string;
    assignedTo: string[]; // User IDs to notify
    task: TaskDTO;
  };
  "task.completed": {
    taskId: string;
    completedBy: string; // Credited user (assignee for member tasks)
    triggeredBy?: string; // Actor who triggered completion (if different)
    task: TaskDTO;
  };
  "task.deleted": {
    taskId: string;
    familyId: string;
    affectedUsers: string[]; // User IDs to notify
  };
}

/**
 * Helper to get user IDs from task assignment
 * Returns array of user IDs that should be notified about this task
 * For role-based assignments, resolves the role to actual user IDs
 */
async function getUserIdsFromAssignment(task: Task): Promise<string[]> {
  if (task.assignment.type === "member") {
    return [task.assignment.memberId.toString()];
  }

  if (task.assignment.type === "role") {
    // Resolve role-based assignment to actual user IDs
    const db = getDb();
    const membershipsCollection =
      db.collection<FamilyMembership>("family_memberships");

    // Map task role string to FamilyRole enum
    const familyRole = task.assignment.role === "parent" ? "Parent" : "Child";

    const memberships = await membershipsCollection
      .find({
        familyId: task.familyId,
        role: familyRole as any, // Cast to avoid type issues with enum
      })
      .toArray();

    return memberships.map((m) => m.userId.toString());
  }

  // For unassigned tasks, notify all family members
  if (task.assignment.type === "unassigned") {
    const db = getDb();
    const membershipsCollection =
      db.collection<FamilyMembership>("family_memberships");

    const memberships = await membershipsCollection
      .find({ familyId: task.familyId })
      .toArray();

    return memberships.map((m) => m.userId.toString());
  }

  return [];
}

/**
 * Emit a task.created event
 * Broadcasts to assigned users when a new task is created
 *
 * @param task The created task
 * @param assignedUserIds Array of user IDs who should be notified (for role-based assignments)
 */
export async function emitTaskCreated(
  task: Task,
  assignedUserIds?: string[],
): Promise<void> {
  try {
    // Determine who to notify
    const targetUserIds =
      assignedUserIds || (await getUserIdsFromAssignment(task));

    if (targetUserIds.length === 0) {
      logger.debug(`Task ${task._id} created but no specific users to notify`);
      return;
    }

    const payload: TaskEventPayloads["task.created"] = {
      taskId: task._id.toString(),
      familyId: task.familyId.toString(),
      assignedTo: targetUserIds,
      task: toTaskDTO(task), // Convert to DTO for proper serialization
    };

    emitToUserRooms("task.created", targetUserIds, payload);

    logger.debug(`Emitted task.created event for task ${task._id}`, {
      taskId: task._id.toString(),
      targetUserIds,
      assignmentType: task.assignment.type,
    });
  } catch (error) {
    logger.error(
      `Failed to emit task.created event for task ${task._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a task.assigned event
 * Broadcasts when a task's assignment changes
 *
 * @param task The task with updated assignment
 * @param assignedUserIds Array of user IDs who should be notified (for role-based assignments)
 */
export async function emitTaskAssigned(
  task: Task,
  assignedUserIds?: string[],
): Promise<void> {
  try {
    // Determine who to notify
    const targetUserIds =
      assignedUserIds || (await getUserIdsFromAssignment(task));

    if (targetUserIds.length === 0) {
      logger.debug(
        `Task ${task._id} assignment changed but no specific users to notify`,
      );
      return;
    }

    const payload: TaskEventPayloads["task.assigned"] = {
      taskId: task._id.toString(),
      assignedTo: targetUserIds,
      task: toTaskDTO(task), // Convert to DTO for proper serialization
    };

    emitToUserRooms("task.assigned", targetUserIds, payload);

    logger.debug(`Emitted task.assigned event for task ${task._id}`, {
      taskId: task._id.toString(),
      targetUserIds,
      assignmentType: task.assignment.type,
    });
  } catch (error) {
    logger.error(
      `Failed to emit task.assigned event for task ${task._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a task.completed event
 * Broadcasts when a task is completed
 *
 * @param task The completed task
 * @param creditedUserId User ID who receives credit (assignee for member tasks)
 * @param triggeredBy User ID who triggered the completion action
 * @param familyMemberIds Optional array of all family member IDs to notify
 */
export function emitTaskCompleted(
  task: Task,
  creditedUserId: ObjectId,
  triggeredBy: ObjectId,
  familyMemberIds?: string[],
): void {
  try {
    // Notify the credited user, plus optionally all family members
    const targetUserIds = familyMemberIds || [creditedUserId.toString()];

    const payload: TaskEventPayloads["task.completed"] = {
      taskId: task._id.toString(),
      completedBy: creditedUserId.toString(),
      triggeredBy:
        creditedUserId.toString() !== triggeredBy.toString()
          ? triggeredBy.toString()
          : undefined,
      task: toTaskDTO(task), // Convert to DTO for proper serialization
    };

    emitToUserRooms("task.completed", targetUserIds, payload);

    logger.debug(`Emitted task.completed event for task ${task._id}`, {
      taskId: task._id.toString(),
      creditedUserId: creditedUserId.toString(),
      triggeredBy: triggeredBy.toString(),
      targetUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit task.completed event for task ${task._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a task.deleted event
 * Broadcasts when a task is deleted
 *
 * @param taskId The deleted task ID
 * @param familyId The family ID
 * @param affectedUserIds Array of user IDs who should be notified
 */
export function emitTaskDeleted(
  taskId: ObjectId,
  familyId: ObjectId,
  affectedUserIds: string[],
): void {
  try {
    if (affectedUserIds.length === 0) {
      logger.debug(`Task ${taskId} deleted but no users to notify`);
      return;
    }

    const payload: TaskEventPayloads["task.deleted"] = {
      taskId: taskId.toString(),
      familyId: familyId.toString(),
      affectedUsers: affectedUserIds,
    };

    emitToUserRooms("task.deleted", affectedUserIds, payload);

    logger.debug(`Emitted task.deleted event for task ${taskId}`, {
      taskId: taskId.toString(),
      affectedUserIds,
    });
  } catch (error) {
    logger.error(
      `Failed to emit task.deleted event for task ${taskId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
