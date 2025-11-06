import { logger } from "@lib/logger";
import { CronJob } from "cron";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { TaskRepository } from "../repositories/task.repository";
import { TaskGeneratorService } from "../services/task-generator.service";

let cronJob: CronJob | null = null;

/**
 * Start the task generation cron job and generate missed tasks on startup
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

    // Generate missed tasks on startup first
    logger.info("Generating missed tasks on startup...");
    taskGeneratorService.generateMissedTasksOnStartup().catch((error) => {
      logger.error("Failed to generate missed tasks on startup", { error });
      // Don't throw here - continue with cron job even if startup generation fails
    });

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
