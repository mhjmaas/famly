import type { Task, TaskAssignmentDTO, TaskDTO } from "../domain/task";

/**
 * Converts a Task entity to a TaskDTO for API responses
 */
export function toTaskDTO(task: Task): TaskDTO {
  // Convert assignment, handling ObjectId conversion for member assignments
  let assignment: TaskAssignmentDTO;
  if (task.assignment.type === "member") {
    assignment = {
      type: "member",
      memberId: task.assignment.memberId.toString(),
    };
  } else {
    assignment = task.assignment;
  }

  return {
    _id: task._id.toString(),
    familyId: task.familyId.toString(),
    name: task.name,
    description: task.description,
    dueDate: task.dueDate?.toISOString(),
    assignment,
    scheduleId: task.scheduleId?.toString(),
    completedAt: task.completedAt?.toISOString(),
    completedBy: task.completedBy?.toString(),
    metadata: task.metadata,
    createdBy: task.createdBy.toString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
