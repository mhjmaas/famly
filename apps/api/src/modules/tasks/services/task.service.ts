import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { fromObjectId, validateObjectId } from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { KarmaService } from "@modules/karma";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../domain/task";
import {
  emitTaskAssigned,
  emitTaskCompleted,
  emitTaskCreated,
  emitTaskDeleted,
} from "../events/task-events";
import type { TaskCompletionHook } from "../hooks/task-completion.hook";
import { TaskCompletionHookRegistry } from "../hooks/task-completion.hook";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskService {
  private hookRegistry: TaskCompletionHookRegistry;

  constructor(
    private taskRepository: TaskRepository,
    private membershipRepository: FamilyMembershipRepository,
    private karmaService?: KarmaService, // Optional to avoid breaking existing instantiations
    private activityEventService?: ActivityEventService, // Optional for activity tracking
  ) {
    this.hookRegistry = new TaskCompletionHookRegistry();
  }

  /**
   * Register a task completion hook
   */
  registerCompletionHook(hook: TaskCompletionHook): void {
    this.hookRegistry.register(hook);
  }

  /**
   * Create a new task
   */
  async createTask(
    familyId: string,
    userId: string,
    input: CreateTaskInput,
  ): Promise<Task> {
    let normalizedFamilyId: string | undefined;
    let normalizedUserId: string | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Creating task", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
        name: input.name,
      });

      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      const task = await this.taskRepository.createTask(
        normalizedFamilyId,
        input,
        normalizedUserId,
      );

      logger.info("Task created successfully", {
        taskId: task._id.toString(),
        familyId,
        userId,
      });

      // Record activity event for non-recurring tasks only
      // (tasks generated from schedules have scheduleId set)
      if (this.activityEventService && !task.scheduleId) {
        try {
          await this.activityEventService.recordEvent({
            userId: normalizedUserId,
            type: "TASK",
            title: task.name,
            description: `Created ${task.name}`,
            metadata: task.metadata?.karma
              ? { karma: task.metadata.karma }
              : undefined,
          });
        } catch (error) {
          // Log error but don't fail task creation
          logger.error("Failed to record activity event for task creation", {
            taskId: task._id.toString(),
            error,
          });
        }
      }

      // Emit real-time event for task creation
      // For member-specific assignments, notify that user
      // For role-based assignments, would need family member IDs (defer to caller)
      await emitTaskCreated(task);

      return task;
    } catch (error) {
      logger.error("Failed to create task", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * List all tasks for a family
   */
  async listTasksForFamily(
    familyId: string,
    userId: string,
    dueDateFrom?: Date,
    dueDateTo?: Date,
  ): Promise<Task[]> {
    let normalizedFamilyId: string | undefined;
    let normalizedUserId: string | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Listing tasks for family", {
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      const tasks =
        dueDateFrom || dueDateTo
          ? await this.taskRepository.findTasksByFamilyAndDateRange(
              normalizedFamilyId,
              dueDateFrom,
              dueDateTo,
            )
          : await this.taskRepository.findTasksByFamily(normalizedFamilyId);

      return tasks;
    } catch (error) {
      logger.error("Failed to list tasks for family", {
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(
    familyId: string,
    taskId: string,
    userId: string,
  ): Promise<Task> {
    let normalizedFamilyId: string | undefined;
    let normalizedTaskId: string | undefined;
    let normalizedUserId: string | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedTaskId = validateObjectId(taskId, "taskId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.debug("Getting task by ID", {
        taskId: normalizedTaskId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      const task = await this.taskRepository.findTaskById(normalizedTaskId);

      if (!task) {
        throw HttpError.notFound("Task not found");
      }

      // Verify task belongs to the specified family
      if (task.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      return task;
    } catch (error) {
      logger.error("Failed to get task by ID", {
        taskId: normalizedTaskId ?? taskId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(
    familyId: string,
    taskId: string,
    userId: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    let normalizedFamilyId: string | undefined;
    let normalizedTaskId: string | undefined;
    let normalizedUserId: string | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedTaskId = validateObjectId(taskId, "taskId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Updating task", {
        taskId: normalizedTaskId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      const existingTask =
        await this.taskRepository.findTaskById(normalizedTaskId);
      if (!existingTask) {
        throw HttpError.notFound("Task not found");
      }

      if (existingTask.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      // Authorization guard: if completing a member-assigned task, only the assignee or a parent can do it
      if (input.completedAt && !existingTask.completedAt) {
        if (
          existingTask.assignment.type === "member" &&
          existingTask.assignment.memberId.toString() !== normalizedUserId
        ) {
          // User is not the assignee, so they must be a parent
          await requireFamilyRole({
            userId: normalizedUserId,
            familyId: normalizedFamilyId,
            allowedRoles: [FamilyRole.Parent],
            membershipRepository: this.membershipRepository,
          });
        }
      }

      // Determine the credited user for task completion
      // For member-assigned tasks, credit goes to the assignee
      // For role/unassigned tasks, credit goes to the actor
      let creditedUserId: string | undefined;
      if (input.completedAt && !existingTask.completedAt) {
        if (existingTask.assignment.type === "member") {
          creditedUserId = existingTask.assignment.memberId.toString();
        } else {
          // Role or unassigned task - credit the actor
          creditedUserId = normalizedUserId;
        }
      }

      // Update the task, passing credited user if task is being completed
      const updatedTask = await this.taskRepository.updateTask(
        normalizedTaskId,
        input,
        creditedUserId,
      );

      if (!updatedTask) {
        throw HttpError.notFound("Task not found");
      }

      // Award karma if task was just completed and has karma metadata
      // Karma is always awarded to the credited user (assignee for member tasks, actor for others)
      if (
        input.completedAt &&
        !existingTask.completedAt &&
        updatedTask.metadata?.karma &&
        this.karmaService &&
        creditedUserId
      ) {
        try {
          await this.karmaService.awardKarma({
            familyId: fromObjectId(updatedTask.familyId),
            userId: creditedUserId,
            amount: updatedTask.metadata.karma,
            source: "task_completion",
            description: `Completed task "${updatedTask.name}"`,
            metadata: { taskId: normalizedTaskId },
          });

          logger.info("Karma awarded for task completion", {
            taskId: normalizedTaskId,
            creditedUserId,
            triggeredBy: normalizedUserId,
            karma: updatedTask.metadata.karma,
          });
        } catch (error) {
          logger.error("Failed to award karma for task completion", {
            taskId: normalizedTaskId,
            creditedUserId,
            triggeredBy: normalizedUserId,
            error,
          });
          // Don't throw - task completion should succeed even if karma fails
        }
      }

      // Deduct karma if task was just uncompleted (set back to incomplete) and has karma metadata
      if (
        input.completedAt === null &&
        existingTask.completedAt &&
        updatedTask.metadata?.karma &&
        this.karmaService
      ) {
        // Use completedBy from existing task to deduct karma from the correct user
        const karmaRecipient = existingTask.completedBy
          ? existingTask.completedBy.toString()
          : normalizedUserId;

        try {
          await this.karmaService.awardKarma({
            familyId: fromObjectId(updatedTask.familyId),
            userId: karmaRecipient,
            amount: -updatedTask.metadata.karma, // Negative to deduct
            source: "task_uncomplete",
            description: `Uncompleted task "${updatedTask.name}"`,
            metadata: { taskId: normalizedTaskId },
          });

          logger.info("Karma deducted for task uncomplete", {
            taskId: normalizedTaskId,
            originalCompletedBy: karmaRecipient,
            triggeredBy: normalizedUserId,
            karma: updatedTask.metadata.karma,
          });
        } catch (error) {
          logger.error("Failed to deduct karma for task uncomplete", {
            taskId: normalizedTaskId,
            originalCompletedBy: karmaRecipient,
            triggeredBy: normalizedUserId,
            error,
          });
          // Don't throw - task uncomplete should succeed even if karma fails
        }
      }

      // Invoke task completion hooks if task was just completed
      // Pass both credited user and triggering actor
      if (input.completedAt && !existingTask.completedAt && creditedUserId) {
        try {
          await this.hookRegistry.invokeHooks(
            updatedTask,
            creditedUserId,
            normalizedUserId,
            (error) => {
              logger.error("Task completion hook failed", {
                taskId: normalizedTaskId,
                creditedUserId,
                triggeredBy: normalizedUserId,
                error,
              });
            },
          );
        } catch (error) {
          logger.error("Unexpected error invoking task completion hooks", {
            taskId: normalizedTaskId,
            creditedUserId,
            triggeredBy: normalizedUserId,
            error,
          });
          // Don't throw - task completion should succeed even if hook fails
        }

        // Emit real-time event for task completion
        // Pass both credited user and triggering actor
        emitTaskCompleted(updatedTask, creditedUserId, normalizedUserId);
      }

      // Check if assignment changed and emit task.assigned event
      const assignmentChanged =
        JSON.stringify(existingTask.assignment) !==
        JSON.stringify(input.assignment);
      if (input.assignment && assignmentChanged) {
        await emitTaskAssigned(updatedTask);
      }

      logger.info("Task updated successfully", {
        taskId: normalizedTaskId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      return updatedTask;
    } catch (error) {
      logger.error("Failed to update task", {
        taskId: normalizedTaskId ?? taskId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(
    familyId: string,
    taskId: string,
    userId: string,
  ): Promise<void> {
    let normalizedFamilyId: string | undefined;
    let normalizedTaskId: string | undefined;
    let normalizedUserId: string | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedTaskId = validateObjectId(taskId, "taskId");
      normalizedUserId = validateObjectId(userId, "userId");

      logger.info("Deleting task", {
        taskId: normalizedTaskId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId: normalizedUserId,
        familyId: normalizedFamilyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can delete tasks
        membershipRepository: this.membershipRepository,
      });

      // Verify task exists and belongs to family
      const existingTask =
        await this.taskRepository.findTaskById(normalizedTaskId);
      if (!existingTask) {
        throw HttpError.notFound("Task not found");
      }

      if (existingTask.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      // Delete the task
      const deleted = await this.taskRepository.deleteTask(normalizedTaskId);

      if (!deleted) {
        throw HttpError.notFound("Task not found");
      }

      // Emit real-time event for task deletion
      // Get family members who should be notified (for now, just emit to all family members)
      // In a complete implementation, we'd fetch family member IDs here
      const affectedUsers: string[] = [];
      if (existingTask.assignment.type === "member") {
        affectedUsers.push(existingTask.assignment.memberId.toString());
      }
      emitTaskDeleted(normalizedTaskId, normalizedFamilyId, affectedUsers);

      logger.info("Task deleted successfully", {
        taskId: normalizedTaskId,
        familyId: normalizedFamilyId,
        userId: normalizedUserId,
      });
    } catch (error) {
      logger.error("Failed to delete task", {
        taskId: normalizedTaskId ?? taskId,
        familyId: normalizedFamilyId ?? familyId,
        userId: normalizedUserId ?? userId,
        error,
      });
      throw error;
    }
  }
}
