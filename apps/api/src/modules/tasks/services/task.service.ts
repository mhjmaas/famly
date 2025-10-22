import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { ObjectId } from "mongodb";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../domain/task";
import type { TaskRepository } from "../repositories/task.repository";

export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private membershipRepository: FamilyMembershipRepository,
  ) {}

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

      // Create the task
      const task = await this.taskRepository.createTask(
        familyId,
        input,
        userId,
      );

      logger.info("Task created successfully", {
        taskId: task._id.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

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

      // Update the task
      const updatedTask = await this.taskRepository.updateTask(taskId, input);

      if (!updatedTask) {
        throw HttpError.notFound("Task not found");
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
