import { createSelector } from "@reduxjs/toolkit";
import { isTaskAssignedToUser, sortTasksByPriority } from "@/lib/task-utils";
import { selectTasks } from "../slices/tasks.slice";
import { selectUser } from "../slices/user.slice";
import type { RootState } from "../store";

/**
 * Selector for pending tasks assigned to the current user.
 * Returns up to 3 tasks, sorted by due date (soonest first), then by creation date.
 * Optionally includes recently completed tasks (completed within the session).
 */
export const selectPendingTasksForUser = createSelector(
  [
    selectTasks,
    selectUser,
    (_state: RootState, recentlyCompletedIds?: Set<string>) =>
      recentlyCompletedIds,
  ],
  (tasks, user, recentlyCompletedIds = new Set()) => {
    if (!user) return [];

    const userRole = user.families?.[0]?.role || "";

    // Get tasks assigned to the user
    const assignedTasks = tasks.filter((task) =>
      isTaskAssignedToUser(task, user.id, userRole),
    );

    // Filter to pending tasks OR recently completed tasks that we want to keep showing
    const tasksToShow = assignedTasks.filter(
      (task) => !task.completedAt || recentlyCompletedIds.has(task._id),
    );

    return sortTasksByPriority(tasksToShow).slice(0, 3);
  },
);

/**
 * Selector for the total potential karma from all pending tasks assigned to the user.
 */
export const selectPotentialKarma = createSelector(
  [selectTasks, selectUser],
  (tasks, user) => {
    if (!user) return 0;

    return tasks
      .filter(
        (task) =>
          !task.completedAt &&
          isTaskAssignedToUser(task, user.id, user.families?.[0]?.role || ""),
      )
      .reduce((sum, task) => sum + (task.metadata?.karma || 0), 0);
  },
);

/**
 * Selector for the count of pending tasks assigned to the user.
 */
export const selectPendingTasksCount = createSelector(
  [selectTasks, selectUser],
  (tasks, user) => {
    if (!user) return 0;

    return tasks.filter(
      (task) =>
        !task.completedAt &&
        isTaskAssignedToUser(task, user.id, user.families?.[0]?.role || ""),
    ).length;
  },
);
