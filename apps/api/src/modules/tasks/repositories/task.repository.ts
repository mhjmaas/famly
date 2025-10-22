import { Collection, ObjectId } from "mongodb";
import { getDb } from "@infra/mongo/client";
import { Task, CreateTaskInput, UpdateTaskInput } from "../domain/task";
import { logger } from "@lib/logger";

export class TaskRepository {
  private collection: Collection<Task>;

  constructor() {
    this.collection = getDb().collection<Task>("tasks");
  }

  /**
   * Ensure indexes are created for the tasks collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for listing tasks by family and due date
      await this.collection.createIndex(
        { familyId: 1, dueDate: 1 },
        { name: "idx_family_duedate" },
      );

      // Index for finding tasks generated from a schedule
      await this.collection.createIndex(
        { familyId: 1, scheduleId: 1 },
        { name: "idx_family_schedule" },
      );

      // Index for listing tasks by creation date
      await this.collection.createIndex(
        { familyId: 1, createdAt: -1 },
        { name: "idx_family_created" },
      );

      // Index for filtering by completion status
      await this.collection.createIndex(
        { familyId: 1, completedAt: 1 },
        { name: "idx_family_completed" },
      );

      logger.info("Task indexes created successfully");
    } catch (error) {
      logger.error("Failed to create task indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new task
   */
  async createTask(
    familyId: ObjectId,
    input: CreateTaskInput,
    createdBy: ObjectId,
    scheduleId?: ObjectId,
  ): Promise<Task> {
    const now = new Date();

    const task: Task = {
      _id: new ObjectId(),
      familyId,
      name: input.name,
      description: input.description,
      dueDate: input.dueDate,
      assignment: input.assignment,
      scheduleId,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(task);

    return task;
  }

  /**
   * Find a task by ID
   */
  async findTaskById(taskId: ObjectId): Promise<Task | null> {
    return this.collection.findOne({ _id: taskId });
  }

  /**
   * Find all tasks for a family
   */
  async findTasksByFamily(familyId: ObjectId): Promise<Task[]> {
    return this.collection.find({ familyId }).sort({ createdAt: -1 }).toArray();
  }

  /**
   * Find tasks for a family within a date range
   */
  async findTasksByFamilyAndDateRange(
    familyId: ObjectId,
    dueDateFrom?: Date,
    dueDateTo?: Date,
  ): Promise<Task[]> {
    const query: any = { familyId };

    if (dueDateFrom || dueDateTo) {
      query.dueDate = {};
      if (dueDateFrom) {
        query.dueDate.$gte = dueDateFrom;
      }
      if (dueDateTo) {
        query.dueDate.$lte = dueDateTo;
      }
    }

    return this.collection
      .find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .toArray();
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: ObjectId,
    input: UpdateTaskInput,
  ): Promise<Task | null> {
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.description !== undefined) {
      updateFields.description = input.description;
    }
    if (input.dueDate !== undefined) {
      updateFields.dueDate = input.dueDate;
    }
    if (input.assignment !== undefined) {
      updateFields.assignment = input.assignment;
    }
    if (input.completedAt !== undefined) {
      updateFields.completedAt = input.completedAt;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: taskId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: taskId });
    return result.deletedCount > 0;
  }

  /**
   * Find a task by schedule and date (for duplicate detection during generation)
   */
  async findTaskByScheduleAndDate(
    scheduleId: ObjectId,
    date: Date,
  ): Promise<Task | null> {
    // Normalize date to start of day for comparison
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999,
    );

    return this.collection.findOne({
      scheduleId,
      dueDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }
}
