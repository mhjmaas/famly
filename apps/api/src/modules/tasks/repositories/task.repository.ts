import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId, toObjectIdArray } from "@lib/objectid-utils";
import {
  type Collection,
  type Filter,
  ObjectId,
  type UpdateFilter,
} from "mongodb";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../domain/task";

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
    familyId: string,
    input: CreateTaskInput,
    createdBy: string,
    scheduleId?: string,
  ): Promise<Task> {
    const now = new Date();

    const task: Task = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      name: input.name,
      description: input.description,
      dueDate: input.dueDate,
      assignment: input.assignment,
      scheduleId: scheduleId ? toObjectId(scheduleId) : undefined,
      metadata: input.metadata,
      createdBy: toObjectId(createdBy),
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(task);

    return task;
  }

  /**
   * Find a task by ID
   */
  async findTaskById(taskId: string): Promise<Task | null> {
    return this.collection.findOne({ _id: { $eq: toObjectId(taskId) } });
  }

  /**
   * Find all tasks for a family
   */
  async findTasksByFamily(familyId: string): Promise<Task[]> {
    return this.collection
      .find({ familyId: toObjectId(familyId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find tasks for a family within a date range
   */
  async findTasksByFamilyAndDateRange(
    familyId: string,
    dueDateFrom?: Date,
    dueDateTo?: Date,
  ): Promise<Task[]> {
    const query: Filter<Task> = { familyId: toObjectId(familyId) };

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
    taskId: string,
    input: UpdateTaskInput,
    completedBy?: string | null,
  ): Promise<Task | null> {
    const setFields: Partial<Task> = {
      updatedAt: new Date(),
    };

    const unsetFields: Partial<Record<keyof Task, "" | 1>> = {};

    if (input.name !== undefined) {
      setFields.name = input.name;
    }
    if (input.description !== undefined) {
      setFields.description = input.description;
    }
    if (input.dueDate !== undefined) {
      setFields.dueDate = input.dueDate;
    }
    if (input.assignment !== undefined) {
      setFields.assignment = input.assignment;
    }
    if (input.completedAt !== undefined) {
      if (input.completedAt === null) {
        unsetFields.completedAt = "";
        unsetFields.completedBy = "";
      } else {
        setFields.completedAt = input.completedAt;
        if (completedBy) {
          setFields.completedBy = toObjectId(completedBy);
        }
      }
    }
    if (input.metadata !== undefined) {
      setFields.metadata = input.metadata;
    }

    const updateDoc: UpdateFilter<Task> = {
      $set: setFields,
    };

    if (Object.keys(unsetFields).length > 0) {
      updateDoc.$unset = unsetFields;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: { $eq: toObjectId(taskId) } },
      updateDoc,
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a task
   */
  async deleteTask(taskId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: { $eq: toObjectId(taskId) },
    });
    return result.deletedCount > 0;
  }

  /**
   * Find a task by schedule and date (for duplicate detection during generation)
   */
  async findTaskByScheduleAndDate(
    scheduleId: string,
    date: Date,
  ): Promise<Task | null> {
    // Normalize date to start of day for comparison (use UTC to avoid timezone issues)
    const startOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfDay = new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return this.collection.findOne({
      scheduleId: toObjectId(scheduleId),
      dueDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  /**
   * Find all incomplete tasks for a schedule
   * Incomplete = tasks without a completedAt timestamp
   */
  async findIncompleteTasksBySchedule(scheduleId: string): Promise<Task[]> {
    return this.collection
      .find({
        scheduleId: toObjectId(scheduleId),
        completedAt: { $exists: false },
      })
      .sort({ dueDate: 1 })
      .toArray();
  }

  /**
   * Delete multiple tasks by their IDs
   * Returns the count of deleted tasks
   */
  async deleteTasksByIds(taskIds: string[]): Promise<number> {
    if (taskIds.length === 0) {
      return 0;
    }

    const result = await this.collection.deleteMany({
      _id: { $in: toObjectIdArray(taskIds) },
    });

    return result.deletedCount;
  }
}
