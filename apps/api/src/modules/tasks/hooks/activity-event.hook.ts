import { logger } from "@lib/logger";
import type { ActivityEventService } from "@modules/activity-events";
import type { ObjectId } from "mongodb";
import type { Task } from "../domain/task";
import type { TaskCompletionHook } from "./task-completion.hook";

/**
 * Hook to record activity events when tasks are completed
 */
export class ActivityEventHook implements TaskCompletionHook {
  constructor(private activityEventService: ActivityEventService) {}

  async onTaskCompleted(task: Task, completedBy: ObjectId): Promise<void> {
    try {
      await this.activityEventService.recordEvent({
        userId: completedBy,
        type: "TASK",
        title: task.name,
        description: `Completed ${task.name}`,
        metadata: task.metadata?.karma
          ? { karma: task.metadata.karma }
          : undefined,
      });

      logger.debug("Activity event recorded for task completion", {
        taskId: task._id.toString(),
        userId: completedBy.toString(),
      });
    } catch (error) {
      // Log error but don't fail task completion
      logger.error("Failed to record activity event for task completion", {
        taskId: task._id.toString(),
        userId: completedBy.toString(),
        error,
      });
    }
  }
}
