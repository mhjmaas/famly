import type { Task, TaskDTO } from "../domain/task";

/**
 * Converts a Task entity to a TaskDTO for API responses
 */
export function toTaskDTO(task: Task): TaskDTO {
  return {
    _id: task._id.toString(),
    familyId: task.familyId.toString(),
    name: task.name,
    description: task.description,
    dueDate: task.dueDate?.toISOString(),
    assignment: task.assignment,
    scheduleId: task.scheduleId?.toString(),
    completedAt: task.completedAt?.toISOString(),
    completedBy: task.completedBy?.toString(),
    metadata: task.metadata,
    createdBy: task.createdBy.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
