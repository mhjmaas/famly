import { CronJob } from "cron";
import { TaskGeneratorService } from "../services/task-generator.service";
import { TaskRepository } from "../repositories/task.repository";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { logger } from "@lib/logger";

let cronJob: CronJob | null = null;

/**
 * Start the task generation cron job
 * Runs daily at 00:05 UTC
 */
export function startTaskScheduler(): void {
  try {
    if (cronJob) {
      logger.warn("Task scheduler already running");
      return;
    }

    // Initialize repositories and service
    const taskRepository = new TaskRepository();
    const scheduleRepository = new ScheduleRepository();
    const taskGeneratorService = new TaskGeneratorService(
      taskRepository,
      scheduleRepository,
    );

    // Create cron job: runs at 00:05 UTC daily
    // Format: second minute hour day month dayOfWeek
    cronJob = new CronJob(
      "0 5 0 * * *", // 00:05:00 every day
      async () => {
        try {
          logger.info("Task generation cron job triggered");
          const today = new Date();
          await taskGeneratorService.generateTasksForDate(today);
        } catch (error) {
          logger.error("Task generation cron job failed", { error });
        }
      },
      null, // onComplete
      true, // start immediately
      "UTC", // timezone
    );

    logger.info("Task scheduler started successfully", {
      schedule: "00:05 UTC daily",
      timezone: "UTC",
    });
  } catch (error) {
    logger.error("Failed to start task scheduler", { error });
    throw error;
  }
}

/**
 * Stop the task generation cron job
 * Used during application shutdown
 */
export function stopTaskScheduler(): void {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    logger.info("Task scheduler stopped");
  }
}

/**
 * Get the current status of the task scheduler
 */
export function getTaskSchedulerStatus(): { running: boolean } {
  return {
    running: cronJob !== null,
  };
}
