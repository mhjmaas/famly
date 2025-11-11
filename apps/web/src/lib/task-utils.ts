import type { Task, TaskAssignment } from "@/types/api.types";

/**
 * Determines if a task is assigned to a specific user based on the assignment type.
 *
 * @param task - The task to check
 * @param userId - The ID of the user to check assignment for
 * @param userRole - The role of the user ("parent" or "child")
 * @returns true if the task is assigned to the user, false otherwise
 */
export function isTaskAssignedToUser(
  task: Task,
  userId: string,
  userRole: string,
): boolean {
  if (!task.assignment) return false;

  switch (task.assignment.type) {
    case "member":
      return task.assignment.memberId === userId;
    case "role":
      return task.assignment.role.toLowerCase() === userRole.toLowerCase();
    case "unassigned":
      return false; // Dashboard doesn't show unassigned tasks
    default:
      return false;
  }
}

/**
 * Sorts tasks by due date (soonest first), then by creation date (newest first).
 * Tasks without due dates are sorted by creation date only.
 *
 * @param tasks - Array of tasks to sort
 * @returns Sorted array of tasks
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Tasks with due dates come first
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;

    if (a.dueDate && b.dueDate) {
      // Sort by due date (soonest first)
      const dueDateComparison =
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (dueDateComparison !== 0) return dueDateComparison;
    }

    // If neither has due date or due dates are equal, sort by creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
