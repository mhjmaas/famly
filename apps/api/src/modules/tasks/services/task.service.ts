import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { KarmaService } from "@modules/karma";
import { ObjectId } from "mongodb";
import type {
  CreateTaskInput,
  Task,
  TaskAssignment,
  UpdateTaskInput,
} from "../domain/task";
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
   * Convert assignment IDs from strings to ObjectIds
   * The validators ensure they're valid ObjectId strings, but don't convert them
   */
  private normalizeAssignment(
    assignment: TaskAssignment | any,
  ): TaskAssignment {
    if (!assignment) return assignment;

    if (
      assignment.type === "member" &&
      typeof assignment.memberId === "string"
    ) {
      return {
        type: "member",
        memberId: new ObjectId(assignment.memberId),
      };
    }

    return assignment;
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
    familyId: ObjectId,
    userId: ObjectId,
    input: CreateTaskInput,
  ): Promise<Task> {
    try {
      logger.info("Creating task", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        name: input.name,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can create tasks
        membershipRepository: this.membershipRepository,
      });

      // Normalize assignment to ensure IDs are ObjectIds
      const normalizedInput = {
        ...input,
        assignment: this.normalizeAssignment(input.assignment),
      };

      // Create the task
      const task = await this.taskRepository.createTask(
        familyId,
        normalizedInput,
        userId,
      );

      logger.info("Task created successfully", {
        taskId: task._id.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Record activity event for non-recurring tasks only
      // (tasks generated from schedules have scheduleId set)
      if (this.activityEventService && !task.scheduleId) {
        try {
          await this.activityEventService.recordEvent({
            userId,
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
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List all tasks for a family
   */
  async listTasksForFamily(
    familyId: ObjectId,
    userId: ObjectId,
    dueDateFrom?: Date,
    dueDateTo?: Date,
  ): Promise<Task[]> {
    try {
      logger.debug("Listing tasks for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can list tasks
        membershipRepository: this.membershipRepository,
      });

      // Fetch tasks with optional date filtering
      const tasks =
        dueDateFrom || dueDateTo
          ? await this.taskRepository.findTasksByFamilyAndDateRange(
              familyId,
              dueDateFrom,
              dueDateTo,
            )
          : await this.taskRepository.findTasksByFamily(familyId);

      return tasks;
    } catch (error) {
      logger.error("Failed to list tasks for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific task by ID
   */
  async getTaskById(
    familyId: ObjectId,
    taskId: ObjectId,
    userId: ObjectId,
  ): Promise<Task> {
    try {
      logger.debug("Getting task by ID", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can get tasks
        membershipRepository: this.membershipRepository,
      });

      // Fetch the task
      const task = await this.taskRepository.findTaskById(taskId);

      if (!task) {
        throw HttpError.notFound("Task not found");
      }

      // Verify task belongs to the specified family
      if (task.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      return task;
    } catch (error) {
      logger.error("Failed to get task by ID", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(
    familyId: ObjectId,
    taskId: ObjectId,
    userId: ObjectId,
    input: UpdateTaskInput,
  ): Promise<Task> {
    try {
      logger.info("Updating task", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can update tasks
        membershipRepository: this.membershipRepository,
      });

      // Verify task exists and belongs to family
      const existingTask = await this.taskRepository.findTaskById(taskId);
      if (!existingTask) {
        throw HttpError.notFound("Task not found");
      }

      if (existingTask.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      // Normalize assignment to ensure IDs are ObjectIds
      if (input.assignment) {
        input.assignment = this.normalizeAssignment(input.assignment);
      }

      // Authorization guard: if completing a member-assigned task, only the assignee or a parent can do it
      if (input.completedAt && !existingTask.completedAt) {
        if (
          existingTask.assignment.type === "member" &&
          existingTask.assignment.memberId.toString() !== userId.toString()
        ) {
          // User is not the assignee, so they must be a parent
          await requireFamilyRole({
            userId,
            familyId,
            allowedRoles: [FamilyRole.Parent],
            membershipRepository: this.membershipRepository,
          });
        }
      }

      // Determine the credited user for task completion
      // For member-assigned tasks, credit goes to the assignee
      // For role/unassigned tasks, credit goes to the actor
      let creditedUserId: ObjectId | undefined;
      if (input.completedAt && !existingTask.completedAt) {
        if (existingTask.assignment.type === "member") {
          creditedUserId = existingTask.assignment.memberId;
        } else {
          // Role or unassigned task - credit the actor
          creditedUserId = userId;
        }
      }

      // Update the task, passing credited user if task is being completed
      const updatedTask = await this.taskRepository.updateTask(
        taskId,
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
            familyId: updatedTask.familyId,
            userId: creditedUserId,
            amount: updatedTask.metadata.karma,
            source: "task_completion",
            description: `Completed task "${updatedTask.name}"`,
            metadata: { taskId: taskId.toString() },
          });

          logger.info("Karma awarded for task completion", {
            taskId: taskId.toString(),
            creditedUserId: creditedUserId.toString(),
            triggeredBy: userId.toString(),
            karma: updatedTask.metadata.karma,
          });
        } catch (error) {
          logger.error("Failed to award karma for task completion", {
            taskId: taskId.toString(),
            creditedUserId: creditedUserId.toString(),
            triggeredBy: userId.toString(),
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
        const karmaRecipient = existingTask.completedBy || userId;

        try {
          await this.karmaService.awardKarma({
            familyId: updatedTask.familyId,
            userId: karmaRecipient,
            amount: -updatedTask.metadata.karma, // Negative to deduct
            source: "task_uncomplete",
            description: `Uncompleted task "${updatedTask.name}"`,
            metadata: { taskId: taskId.toString() },
          });

          logger.info("Karma deducted for task uncomplete", {
            taskId: taskId.toString(),
            originalCompletedBy: karmaRecipient.toString(),
            triggeredBy: userId.toString(),
            karma: updatedTask.metadata.karma,
          });
        } catch (error) {
          logger.error("Failed to deduct karma for task uncomplete", {
            taskId: taskId.toString(),
            originalCompletedBy: karmaRecipient.toString(),
            triggeredBy: userId.toString(),
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
            userId,
            (error) => {
              logger.error("Task completion hook failed", {
                taskId: taskId.toString(),
                creditedUserId: creditedUserId.toString(),
                triggeredBy: userId.toString(),
                error,
              });
            },
          );
        } catch (error) {
          logger.error("Unexpected error invoking task completion hooks", {
            taskId: taskId.toString(),
            creditedUserId: creditedUserId.toString(),
            triggeredBy: userId.toString(),
            error,
          });
          // Don't throw - task completion should succeed even if hook fails
        }

        // Emit real-time event for task completion
        // Pass both credited user and triggering actor
        emitTaskCompleted(updatedTask, creditedUserId, userId);
      }

      // Check if assignment changed and emit task.assigned event
      const assignmentChanged =
        JSON.stringify(existingTask.assignment) !==
        JSON.stringify(input.assignment);
      if (input.assignment && assignmentChanged) {
        await emitTaskAssigned(updatedTask);
      }

      logger.info("Task updated successfully", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedTask;
    } catch (error) {
      logger.error("Failed to update task", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(
    familyId: ObjectId,
    taskId: ObjectId,
    userId: ObjectId,
  ): Promise<void> {
    try {
      logger.info("Deleting task", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child], // Both roles can delete tasks
        membershipRepository: this.membershipRepository,
      });

      // Verify task exists and belongs to family
      const existingTask = await this.taskRepository.findTaskById(taskId);
      if (!existingTask) {
        throw HttpError.notFound("Task not found");
      }

      if (existingTask.familyId.toString() !== familyId.toString()) {
        throw HttpError.forbidden("Task does not belong to this family");
      }

      // Delete the task
      const deleted = await this.taskRepository.deleteTask(taskId);

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
      emitTaskDeleted(taskId, familyId, affectedUsers);

      logger.info("Task deleted successfully", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });
    } catch (error) {
      logger.error("Failed to delete task", {
        taskId: taskId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }
}
