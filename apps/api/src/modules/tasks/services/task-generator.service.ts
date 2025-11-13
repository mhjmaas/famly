import { logger } from "@lib/logger";
import type { TaskSchedule } from "../domain/task";
import { emitTaskCreated } from "../events/task-events";
import { shouldGenerateForDate } from "../lib/schedule-matcher";
import type { ScheduleRepository } from "../repositories/schedule.repository";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskGeneratorService {
  constructor(
    private taskRepository: TaskRepository,
    private scheduleRepository: ScheduleRepository,
  ) {}

  /**
   * Generates a task immediately for a specific schedule.
   * Used when a schedule is created so families see the first task right away.
   */
  async generateTaskForSchedule(
    schedule: TaskSchedule,
    date: Date = new Date(),
  ): Promise<boolean> {
    try {
      return await this.processSchedule(schedule, date);
    } catch (error) {
      logger.error("Failed to generate task for schedule", {
        scheduleId: schedule._id.toString(),
        scheduleName: schedule.name,
        error,
      });
      throw error;
    }
  }

  /**
   * Generate tasks for a specific date based on active schedules
   * This is called by the daily cron job
   */
  async generateTasksForDate(date: Date): Promise<void> {
    try {
      logger.info("Starting task generation", {
        date: date.toISOString(),
      });

      // Find all active schedules for the given date
      const activeSchedules =
        await this.scheduleRepository.findActiveSchedules(date);

      logger.debug("Found active schedules", {
        count: activeSchedules.length,
        date: date.toISOString(),
      });

      let tasksCreated = 0;
      let tasksSkipped = 0;

      // Process each schedule
      for (const schedule of activeSchedules) {
        try {
          const created = await this.processSchedule(schedule, date);
          if (created) {
            tasksCreated++;
          } else {
            tasksSkipped++;
          }
        } catch (error) {
          logger.error("Failed to generate task from schedule", {
            scheduleId: schedule._id.toString(),
            scheduleName: schedule.name,
            error,
          });
          // Continue processing other schedules even if one fails
        }
      }

      logger.info("Task generation completed", {
        date: date.toISOString(),
        schedulesProcessed: activeSchedules.length,
        tasksCreated,
        tasksSkipped,
      });
    } catch (error) {
      logger.error("Task generation failed", {
        date: date.toISOString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Generate today's tasks during system startup
   * This is called when the system starts to ensure today has a task if needed.
   * It does NOT backfill missed tasks - only one active task per schedule should exist.
   */
  async generateMissedTasksOnStartup(): Promise<void> {
    try {
      logger.info("Starting task generation on startup");

      // Get today's date in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Simply delegate to generateTasksForDate with today
      // This ensures the same "one active task per schedule" behavior
      await this.generateTasksForDate(today);

      logger.info("Task generation on startup completed");
    } catch (error) {
      logger.error("Task generation on startup failed", {
        error,
      });
      throw error;
    }
  }

  private async processSchedule(
    schedule: TaskSchedule,
    date: Date,
  ): Promise<boolean> {
    // Check if this schedule should generate a task for this date
    const shouldGenerate = shouldGenerateForDate(
      schedule.schedule,
      date,
      schedule.lastGeneratedDate,
    );

    if (!shouldGenerate) {
      logger.debug("Skipping schedule - criteria not met", {
        scheduleId: schedule._id.toString(),
        scheduleName: schedule.name,
        date: date.toISOString(),
      });
      return false;
    }

    // Check for duplicate task (idempotency)
    const existingTask = await this.taskRepository.findTaskByScheduleAndDate(
      schedule._id,
      date,
    );

    if (existingTask) {
      logger.debug("Task already exists for schedule and date", {
        scheduleId: schedule._id.toString(),
        taskId: existingTask._id.toString(),
        date: date.toISOString(),
      });
      return false;
    }

    await this.cleanupIncompleteTasks(schedule);

    const dueDate = this.buildDueDate(date, schedule.timeOfDay);

    // Create task from schedule
    const task = await this.taskRepository.createTask(
      schedule.familyId,
      {
        name: schedule.name,
        description: schedule.description,
        dueDate,
        assignment: schedule.assignment,
        metadata: schedule.metadata,
      },
      schedule.createdBy,
      schedule._id, // Link to schedule
    );

    // Update last generated date
    await this.scheduleRepository.updateLastGeneratedDate(schedule._id, date);

    logger.info("Task generated from schedule", {
      taskId: task._id.toString(),
      scheduleId: schedule._id.toString(),
      scheduleName: schedule.name,
      familyId: schedule.familyId.toString(),
      dueDate: dueDate.toISOString(),
    });

    // Emit real-time event for task creation
    await emitTaskCreated(task);

    return true;
  }

  private async cleanupIncompleteTasks(schedule: TaskSchedule): Promise<void> {
    const incompleteTasks =
      await this.taskRepository.findIncompleteTasksBySchedule(schedule._id);

    if (incompleteTasks.length === 0) {
      return;
    }

    const taskIds = incompleteTasks.map((task) => task._id);
    const deletedCount = await this.taskRepository.deleteTasksByIds(taskIds);

    logger.info("Cleaned up incomplete tasks before generating new task", {
      scheduleId: schedule._id.toString(),
      scheduleName: schedule.name,
      deletedCount,
      taskIds: taskIds.map((id) => id.toString()),
    });
  }

  private buildDueDate(date: Date, timeOfDay?: string): Date {
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(":").map(Number);
      return new Date(
        Date.UTC(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate(),
          hours,
          minutes,
        ),
      );
    }

    // Default to end of day (21:00 UTC) if no time specified
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        21,
        0,
      ),
    );
  }
}
