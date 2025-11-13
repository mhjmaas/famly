import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, type Filter, ObjectId } from "mongodb";
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
      // Index for finding entries by creator (personal diary)
      await this.collection.createIndex(
        { createdBy: 1, date: -1 },
        { name: "idx_creator_date" },
      );

      // Index for date range queries (personal diary)
      await this.collection.createIndex(
        { createdBy: 1, date: 1 },
        { name: "idx_creator_daterange" },
      );

      // Index for finding family entries
      await this.collection.createIndex(
        { familyId: 1, isPersonal: 1, date: -1 },
        { name: "idx_family_date" },
      );

      // Index for family date range queries
      await this.collection.createIndex(
        { familyId: 1, isPersonal: 1, date: 1 },
        { name: "idx_family_daterange" },
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
    const query: Filter<DiaryEntry> = { createdBy: userId };

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

  /**
   * Create a new family diary entry
   */
  async createFamilyEntry(
    userId: ObjectId,
    familyId: ObjectId,
    input: CreateDiaryEntryInput,
  ): Promise<DiaryEntry> {
    const now = new Date();

    const entry: DiaryEntry = {
      _id: new ObjectId(),
      date: input.date,
      entry: input.entry,
      isPersonal: false, // Always false for entries created via family diary endpoint
      createdBy: userId,
      familyId, // Set familyId for family entries
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(entry);

    return entry;
  }

  /**
   * Find all diary entries for a specific family, sorted by date descending
   */
  async findByFamilyId(familyId: ObjectId): Promise<DiaryEntry[]> {
    return this.collection
      .find({ familyId, isPersonal: false })
      .sort({ date: -1 })
      .toArray();
  }

  /**
   * Find family diary entries within an optional date range
   * Both startDate and endDate are optional
   */
  async findFamilyEntriesInDateRange(
    familyId: ObjectId,
    startDate?: string, // Format: YYYY-MM-DD
    endDate?: string, // Format: YYYY-MM-DD
  ): Promise<DiaryEntry[]> {
    const query: Filter<DiaryEntry> = { familyId, isPersonal: false };

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
}
