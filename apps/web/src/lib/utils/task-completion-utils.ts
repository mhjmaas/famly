/**
 * Task Completion Helpers
 * Utilities for determining task completion permissions and karma recipients
 */

import type { Task } from "@/types/api.types";

type ViewerRole = "Parent" | "Child";

/**
 * Determines who receives karma credit for completing a task
 * @param task - The task being completed
 * @param viewerId - The ID of the user viewing/completing the task
 * @returns The user ID who should receive karma credit
 */
export function getTaskKarmaRecipient(task: Task, viewerId: string): string {
  // For member-assigned tasks, credit always goes to the assignee
  if (task.assignment.type === "member") {
    return task.assignment.memberId;
  }

  // For role-based or unassigned tasks, credit goes to the actor
  return viewerId;
}

/**
 * Checks if a member-assigned task can be completed by the viewer
 * @internal
 */
function canCompleteMemberAssignedTask(
  assignedMemberId: string,
  viewerId: string,
  viewerRole: ViewerRole,
): boolean {
  // Assignee can always complete their own task
  if (assignedMemberId === viewerId) {
    return true;
  }

  // Only parents can complete tasks assigned to other members
  return viewerRole === "Parent";
}

/**
 * Checks if a role-based task can be completed by the viewer
 * @internal
 */
function canCompleteRoleBasedTask(
  requiredRole: "parent" | "child",
  viewerRole: ViewerRole,
): boolean {
  if (requiredRole === "parent") {
    return viewerRole === "Parent";
  }
  if (requiredRole === "child") {
    return viewerRole === "Child";
  }
  return false;
}

/**
 * Determines if the viewer can complete a given task
 * @param task - The task to check
 * @param viewerId - The ID of the user viewing the task
 * @param viewerRole - The role of the viewer ("Parent" or "Child")
 * @returns True if the viewer can complete the task
 */
export function canCompleteTask(
  task: Task,
  viewerId: string,
  viewerRole: ViewerRole,
): boolean {
  // If task is already completed, cannot complete again
  if (task.completedAt) {
    return false;
  }

  // For member-assigned tasks
  if (task.assignment.type === "member") {
    return canCompleteMemberAssignedTask(
      task.assignment.memberId,
      viewerId,
      viewerRole,
    );
  }

  // For role-based tasks, check if viewer has the required role
  if (task.assignment.type === "role") {
    return canCompleteRoleBasedTask(task.assignment.role, viewerRole);
  }

  // For unassigned tasks, anyone can complete
  return true;
}

/**
 * Gets the blocked reason for a member-assigned task
 * @internal
 */
function getMemberAssignmentBlockedReason(
  assignedMemberId: string,
  viewerId: string,
  viewerRole: ViewerRole,
): string | null {
  if (assignedMemberId !== viewerId && viewerRole !== "Parent") {
    return "Only the assignee or a parent can complete this task";
  }
  return null;
}

/**
 * Gets the blocked reason for a role-based task
 * @internal
 */
function getRoleAssignmentBlockedReason(
  requiredRole: "parent" | "child",
  viewerRole: ViewerRole,
): string | null {
  if (requiredRole === "parent" && viewerRole !== "Parent") {
    return "Only parents can complete this task";
  }
  if (requiredRole === "child" && viewerRole !== "Child") {
    return "Only children can complete this task";
  }
  return null;
}

/**
 * Gets a user-friendly message explaining why a task cannot be completed
 * @param task - The task
 * @param viewerId - The ID of the user viewing the task
 * @param viewerRole - The role of the viewer
 * @returns A message explaining why the task cannot be completed, or null if it can be completed
 */
export function getTaskCompletionBlockedReason(
  task: Task,
  viewerId: string,
  viewerRole: ViewerRole,
): string | null {
  if (task.completedAt) {
    return "This task is already completed";
  }

  if (task.assignment.type === "member") {
    return getMemberAssignmentBlockedReason(
      task.assignment.memberId,
      viewerId,
      viewerRole,
    );
  }

  if (task.assignment.type === "role") {
    return getRoleAssignmentBlockedReason(task.assignment.role, viewerRole);
  }

  return null;
}
