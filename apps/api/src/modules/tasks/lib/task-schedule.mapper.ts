import type { TaskSchedule, TaskScheduleDTO } from "../domain/task-schedule";

/**
 * Converts a TaskSchedule entity to a TaskScheduleDTO for API responses
 */
export function toTaskScheduleDTO(schedule: TaskSchedule): TaskScheduleDTO {
  return {
    _id: schedule._id.toString(),
    familyId: schedule.familyId.toString(),
    name: schedule.name,
    description: schedule.description,
    assignment: schedule.assignment,
    schedule: schedule.schedule,
    timeOfDay: schedule.timeOfDay,
    createdBy: schedule.createdBy.toString(),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
    lastGeneratedDate: schedule.lastGeneratedDate?.toISOString(),
  };
}
