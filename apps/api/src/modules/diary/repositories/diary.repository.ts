import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type {
  CreateDiaryEntryInput,
  DiaryEntry,
  UpdateDiaryEntryInput,
} from "../domain/diary-entry";

export class DiaryRepository {
  private collection: Collection<DiaryEntry>;

  constructor() {
    this.collection = getDb().collection<DiaryEntry>("diary_entries");
  }

  /**
   * Ensure indexes are created for the diary entries collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for finding entries by creator
      await this.collection.createIndex(
        { createdBy: 1, date: -1 },
        { name: "idx_creator_date" },
      );

      // Index for date range queries
      await this.collection.createIndex(
        { createdBy: 1, date: 1 },
        { name: "idx_creator_daterange" },
      );

      logger.info("Diary entry indexes created successfully");
    } catch (error) {
      logger.error("Failed to create diary entry indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new diary entry
   */
  async createEntry(
    userId: ObjectId,
    input: CreateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    const now = new Date();

    const entry: DiaryEntry = {
      _id: new ObjectId(),
      date: input.date,
      entry: input.entry,
      isPersonal: true, // Always true for entries created via personal diary endpoint
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(entry);

    return entry;
  }

  /**
   * Find a diary entry by ID
   */
  async findById(entryId: ObjectId): Promise<DiaryEntry | null> {
    return this.collection.findOne({ _id: entryId });
  }

  /**
   * Find all diary entries for a specific user, sorted by date descending
   */
  async findByCreator(userId: ObjectId): Promise<DiaryEntry[]> {
    return this.collection
      .find({ createdBy: userId })
      .sort({ date: -1 })
      .toArray();
  }

  /**
   * Find diary entries for a user within an optional date range
   * Both startDate and endDate are optional
   */
  async findByCreatorInDateRange(
    userId: ObjectId,
    startDate?: string, // Format: YYYY-MM-DD
    endDate?: string, // Format: YYYY-MM-DD
  ): Promise<DiaryEntry[]> {
    // biome-ignore lint/suspicious/noExplicitAny: MongoDB query builder requires any
    const query: any = { createdBy: userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = startDate;
      }
      if (endDate) {
        query.date.$lte = endDate;
      }
    }

    return this.collection.find(query).sort({ date: -1 }).toArray();
  }

  /**
   * Update a diary entry
   */
  async updateEntry(
    entryId: ObjectId,
    input: UpdateDiaryEntryInput,
  ): Promise<DiaryEntry | null> {
    const updateFields: Partial<DiaryEntry> = {
      updatedAt: new Date(),
    };

    if (input.date !== undefined) {
      updateFields.date = input.date;
    }
    if (input.entry !== undefined) {
      updateFields.entry = input.entry;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: entryId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a diary entry
   */
  async deleteEntry(entryId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({ _id: entryId });
    return result.deletedCount > 0;
  }
}
