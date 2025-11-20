"use client";

import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { useNotificationTranslations } from "@/hooks/use-notification-translations";
import { useAppDispatch } from "@/store/hooks";
import { fetchTasks } from "@/store/slices/tasks.slice";
import type { TaskEventPayloads } from "./types";

/**
 * Hook for subscribing to task-related realtime events
 * Handles task.created, task.assigned, task.completed, task.deleted events
 *
 * @param socket Socket.IO instance
 * @param familyId Current family ID
 * @param userId Current user ID
 * @param enabled Whether to enable event subscriptions
 */
export function useTaskEvents(
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

    // Handler for task.created event
    const handleTaskCreated = (event: TaskEventPayloads["task.created"]) => {
      console.log("[Realtime] Task created:", event.task.name);

      // Refresh tasks list to include new task
      dispatch(fetchTasks(familyId));

      // Show notification if task is assigned to current user
      if (
        event.task.assignment.type === "member" &&
        event.task.assignment.memberId === userId
      ) {
        toast.success(t.task.created, {
          description: t.task.createdDescription.replace(
            "{name}",
            event.task.name,
          ),
        });
      }
    };

    // Handler for task.assigned event
    const handleTaskAssigned = (event: TaskEventPayloads["task.assigned"]) => {
      console.log("[Realtime] Task assigned:", event.task.name);

      // Refresh tasks list
      dispatch(fetchTasks(familyId));

      // Show notification if assigned to current user
      if (
        event.task.assignment.type === "member" &&
        event.task.assignment.memberId === userId
      ) {
        toast.info(t.task.assigned, {
          description: t.task.assignedDescription.replace(
            "{name}",
            event.task.name,
          ),
        });
      }
    };

    // Handler for task.completed event
    const handleTaskCompleted = (
      event: TaskEventPayloads["task.completed"],
    ) => {
      console.log("[Realtime] Task completed:", event.task.name);

      // Refresh tasks list
      dispatch(fetchTasks(familyId));

      // Determine who actually triggered the completion
      // If triggeredBy is set, someone else completed it; otherwise completedBy did it themselves
      const wasCompletedByOther = event.triggeredBy
        ? event.triggeredBy !== userId
        : event.completedBy !== userId;

      // Show notification if it's the current user's task and someone else completed it
      if (
        event.task.assignment.type === "member" &&
        event.task.assignment.memberId === userId &&
        wasCompletedByOther
      ) {
        toast.success(t.task.completed, {
          description: t.task.completedDescription.replace(
            "{name}",
            event.task.name,
          ),
        });
      }
    };

    // Handler for task.deleted event
    const handleTaskDeleted = (event: TaskEventPayloads["task.deleted"]) => {
      console.log("[Realtime] Task deleted:", event.taskId);

      // Refresh tasks list to remove deleted task
      dispatch(fetchTasks(familyId));
    };

    // Subscribe to events
    socket.on("task.created", handleTaskCreated);
    socket.on("task.assigned", handleTaskAssigned);
    socket.on("task.completed", handleTaskCompleted);
    socket.on("task.deleted", handleTaskDeleted);

    // Cleanup
    return () => {
      socket.off("task.created", handleTaskCreated);
      socket.off("task.assigned", handleTaskAssigned);
      socket.off("task.completed", handleTaskCompleted);
      socket.off("task.deleted", handleTaskDeleted);
    };
  }, [socket, familyId, userId, enabled, dispatch, t]);
}
