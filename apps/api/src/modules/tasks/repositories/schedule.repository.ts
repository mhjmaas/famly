import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId } from "@lib/objectid-utils";
import { type Collection, ObjectId } from "mongodb";
import type {
  CreateScheduleInput,
  TaskSchedule,
  UpdateScheduleInput,
} from "../domain/task";

export class ScheduleRepository {
  private collection: Collection<TaskSchedule>;

  constructor() {
    this.collection = getDb().collection<TaskSchedule>("task_schedules");
  }

  /**
   * Ensure indexes are created for the task_schedules collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for listing schedules by family
      await this.collection.createIndex(
        { familyId: 1 },
        { name: "idx_family_schedules" },
      );

      // Index for finding active schedules by start date
      await this.collection.createIndex(
        { familyId: 1, "schedule.startDate": 1 },
        { name: "idx_family_startdate" },
      );

      logger.info("Schedule indexes created successfully");
    } catch (error) {
      logger.error("Failed to create schedule indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new task schedule
   */
  async createSchedule(
    familyId: string,
    input: CreateScheduleInput,
    createdBy: string,
  ): Promise<TaskSchedule> {
    const now = new Date();

    const schedule: TaskSchedule = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      name: input.name,
      description: input.description,
      assignment: input.assignment,
      schedule: input.schedule,
      timeOfDay: input.timeOfDay,
      metadata: input.metadata,
      createdBy: toObjectId(createdBy),
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(schedule);

    return schedule;
  }

  /**
   * Find a schedule by ID
   */
  async findScheduleById(scheduleId: string): Promise<TaskSchedule | null> {
    return this.collection.findOne({ _id: toObjectId(scheduleId) });
  }

  /**
   * Find all schedules for a family
   */
  async findSchedulesByFamily(familyId: string): Promise<TaskSchedule[]> {
    return this.collection
      .find({ familyId: toObjectId(familyId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Find active schedules (for task generation)
   * Active = startDate <= today AND (no endDate OR endDate >= today)
   */
  async findActiveSchedules(date: Date): Promise<TaskSchedule[]> {
    // Normalize date to start of day (use UTC to avoid timezone issues)
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

    return this.collection
      .find({
        "schedule.startDate": { $lte: startOfDay },
        $or: [
          { "schedule.endDate": { $exists: false } },
          { "schedule.endDate": null },
          { "schedule.endDate": { $gte: startOfDay } },
        ],
      })
      .toArray();
  }

  /**
   * Update a schedule
   */
  async updateSchedule(
    scheduleId: string,
    input: UpdateScheduleInput,
  ): Promise<TaskSchedule | null> {
    const updateFields: Partial<TaskSchedule> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.description !== undefined) {
      updateFields.description = input.description;
    }
    if (input.assignment !== undefined) {
      updateFields.assignment = input.assignment;
    }
    if (input.schedule !== undefined) {
      updateFields.schedule = input.schedule;
    }
    if (input.timeOfDay !== undefined) {
      updateFields.timeOfDay = input.timeOfDay;
    }
    if (input.metadata !== undefined) {
      updateFields.metadata = input.metadata;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: toObjectId(scheduleId) },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Update the last generated date for a schedule
   */
  async updateLastGeneratedDate(scheduleId: string, date: Date): Promise<void> {
    await this.collection.updateOne(
      { _id: toObjectId(scheduleId) },
      {
        $set: {
          lastGeneratedDate: date,
          updatedAt: new Date(),
        },
      },
    );
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: toObjectId(scheduleId),
    });
    return result.deletedCount > 0;
  }
}
