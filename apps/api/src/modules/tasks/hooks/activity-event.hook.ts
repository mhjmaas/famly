import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import type { Task } from "../domain/task";
import type { TaskCompletionHook } from "./task-completion.hook";

/**
 * Hook to record activity events when tasks are completed
 */
export class ActivityEventHook implements TaskCompletionHook {
  constructor(private activityEventService: ActivityEventService) {}

  /**
   * Called when a task is completed
   * Records an activity event for the completion
   */
  async onTaskCompleted(
    task: Task,
    creditedUserId: string,
    triggeredBy: string,
  ): Promise<void> {
    try {
      const normalizedCreditedUserId = validateObjectId(
        creditedUserId,
        "creditedUserId",
      );
      const normalizedTriggeredBy = validateObjectId(
        triggeredBy,
        "triggeredBy",
      );

      // Build metadata with karma and triggeredBy if different from credited user
      const metadata: Record<string, any> = {};
      if (task.metadata?.karma) {
        metadata.karma = task.metadata.karma;
      }
      if (creditedUserId !== triggeredBy) {
        metadata.triggeredBy = normalizedTriggeredBy;
      }

      await this.activityEventService.recordEvent({
        userId: normalizedCreditedUserId,
        type: "TASK",
        detail: "COMPLETED",
        title: task.name,
        description: `Completed ${task.name}`,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      });

      logger.debug("Activity event recorded for task completion", {
        taskId: task._id.toString(),
        creditedUserId: normalizedCreditedUserId,
        triggeredBy: normalizedTriggeredBy,
      });
    } catch (error) {
      // Log but don't throw - activity event failures shouldn't block task completion
      logger.error("Failed to record activity event for task completion", {
        taskId: task._id.toString(),
        creditedUserId,
        triggeredBy,
        error,
      });
    }
  }
}
