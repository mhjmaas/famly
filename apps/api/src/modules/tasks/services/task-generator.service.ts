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

  /**
   * Generate missed tasks during system startup
   * This is called when the system starts to ensure tasks are created for any
   * days that were missed due to system downtime or crashes
   */
  async generateMissedTasksOnStartup(): Promise<void> {
    try {
      logger.info("Starting missed task generation on startup");

      // Get today's date in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Find all active schedules
      const activeSchedules =
        await this.scheduleRepository.findActiveSchedules(today);

      logger.debug("Found active schedules for startup task generation", {
        count: activeSchedules.length,
      });

      let tasksCreated = 0;
      let tasksSkipped = 0;

      // Process each schedule
      for (const schedule of activeSchedules) {
        try {
          // Calculate the date range to check for missed tasks
          // Start from the schedule's start date or lastGeneratedDate (whichever is later)
          const startDate = schedule.lastGeneratedDate
            ? new Date(schedule.lastGeneratedDate)
            : new Date(schedule.schedule.startDate);

          // Normalize to start of day
          startDate.setUTCHours(0, 0, 0, 0);

          // Check dates from start date to today (exclusive)
          const currentDate = new Date(startDate);
          while (currentDate < today) {
            try {
              // Check if this schedule should generate a task for this date
              const shouldGenerate = shouldGenerateForDate(
                schedule.schedule,
                currentDate,
                schedule.lastGeneratedDate,
              );

              if (shouldGenerate) {
                // Check for duplicate task (idempotency)
                const existingTask =
                  await this.taskRepository.findTaskByScheduleAndDate(
                    schedule._id,
                    currentDate,
                  );

                if (!existingTask) {
                  // Calculate due date with time of day
                  let dueDate: Date | undefined;
                  if (schedule.timeOfDay) {
                    const [hours, minutes] = schedule.timeOfDay
                      .split(":")
                      .map(Number);
                    dueDate = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                      hours,
                      minutes,
                    );
                  } else {
                    // Default to midnight if no time specified
                    dueDate = new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      currentDate.getDate(),
                    );
                  }

                  // Create task from schedule
                  await this.taskRepository.createTask(
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

                  logger.info("Missed task created on startup", {
                    scheduleId: schedule._id.toString(),
                    scheduleName: schedule.name,
                    dueDate: dueDate.toISOString(),
                    missedDate: currentDate.toISOString(),
                  });

                  tasksCreated++;
                } else {
                  tasksSkipped++;
                }
              } else {
                tasksSkipped++;
              }
            } catch (error) {
              logger.error(
                "Failed to process date for missed task generation",
                {
                  scheduleId: schedule._id.toString(),
                  date: currentDate.toISOString(),
                  error,
                },
              );
            }

            // Move to next day
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
          }

          // Update last generated date to today
          await this.scheduleRepository.updateLastGeneratedDate(
            schedule._id,
            today,
          );
        } catch (error) {
          logger.error("Failed to generate missed tasks for schedule", {
            scheduleId: schedule._id.toString(),
            scheduleName: schedule.name,
            error,
          });
          // Continue processing other schedules even if one fails
        }
      }

      logger.info("Missed task generation on startup completed", {
        schedulesProcessed: activeSchedules.length,
        tasksCreated,
        tasksSkipped,
      });
    } catch (error) {
      logger.error("Missed task generation on startup failed", {
        error,
      });
      throw error;
    }
  }
}
