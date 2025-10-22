import { logger } from "@lib/logger";
import { shouldGenerateForDate } from "../lib/schedule-matcher";
import type { ScheduleRepository } from "../repositories/schedule.repository";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskGeneratorService {
  constructor(
    private taskRepository: TaskRepository,
    private scheduleRepository: ScheduleRepository,
  ) {}

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
            tasksSkipped++;
            continue;
          }

          // Check for duplicate task (idempotency)
          const existingTask =
            await this.taskRepository.findTaskByScheduleAndDate(
              schedule._id,
              date,
            );

          if (existingTask) {
            logger.debug("Task already exists for schedule and date", {
              scheduleId: schedule._id.toString(),
              taskId: existingTask._id.toString(),
              date: date.toISOString(),
            });
            tasksSkipped++;
            continue;
          }

          // Calculate due date with time of day
          let dueDate: Date | undefined;
          if (schedule.timeOfDay) {
            const [hours, minutes] = schedule.timeOfDay.split(":").map(Number);
            dueDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              hours,
              minutes,
            );
          } else {
            // Default to midnight if no time specified
            dueDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            );
          }

          // Create task from schedule
          const task = await this.taskRepository.createTask(
            schedule.familyId,
            {
              name: schedule.name,
              description: schedule.description,
              dueDate,
              assignment: schedule.assignment,
            },
            schedule.createdBy,
            schedule._id, // Link to schedule
          );

          // Update last generated date
          await this.scheduleRepository.updateLastGeneratedDate(
            schedule._id,
            date,
          );

          logger.info("Task generated from schedule", {
            taskId: task._id.toString(),
            scheduleId: schedule._id.toString(),
            scheduleName: schedule.name,
            familyId: schedule.familyId.toString(),
            dueDate: dueDate.toISOString(),
          });

          tasksCreated++;
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
}
