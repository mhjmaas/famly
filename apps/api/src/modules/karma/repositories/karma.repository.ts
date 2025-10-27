import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type { KarmaEvent, MemberKarma } from "../domain/karma";

export class KarmaRepository {
  private memberKarmaCollection: Collection<MemberKarma>;
  private karmaEventsCollection: Collection<KarmaEvent>;

  constructor() {
    const db = getDb();
    this.memberKarmaCollection = db.collection<MemberKarma>("member_karma");
    this.karmaEventsCollection = db.collection<KarmaEvent>("karma_events");
  }

  /**
   * Ensure indexes are created for karma collections
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // member_karma indexes
      await this.memberKarmaCollection.createIndex(
        { familyId: 1, userId: 1 },
        { unique: true, name: "idx_member_karma_unique" },
      );
      await this.memberKarmaCollection.createIndex(
        { familyId: 1 },
        { name: "idx_member_karma_family" },
      );

      // karma_events indexes
      await this.karmaEventsCollection.createIndex(
        { familyId: 1, userId: 1, createdAt: -1 },
        { name: "idx_karma_events_user_time" },
      );
      await this.karmaEventsCollection.createIndex(
        { createdAt: -1 },
        { name: "idx_karma_events_time" },
      );

      logger.info("Karma indexes created successfully");
    } catch (error) {
      logger.error("Failed to create karma indexes:", error);
      throw error;
    }
  }

  /**
   * Find member karma by family and user
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @returns The member karma document or null if not found
   */
  async findMemberKarma(
    familyId: ObjectId,
    userId: ObjectId,
  ): Promise<MemberKarma | null> {
    return this.memberKarmaCollection.findOne({ familyId, userId });
  }

  /**
   * Upsert member karma (create or increment)
   * Uses atomic $inc operation to prevent race conditions
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @param incrementAmount - Amount to increment (must be positive)
   * @returns The updated member karma document
   */
  async upsertMemberKarma(
    familyId: ObjectId,
    userId: ObjectId,
    incrementAmount: number,
  ): Promise<MemberKarma> {
    const now = new Date();

    const result = await this.memberKarmaCollection.findOneAndUpdate(
      { familyId, userId },
      {
        $inc: { totalKarma: incrementAmount },
        $set: { updatedAt: now },
        $setOnInsert: {
          _id: new ObjectId(),
          familyId,
          userId,
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new Error("Failed to upsert member karma");
    }

    return result;
  }

  /**
   * Create a new karma event
   *
   * @param event - The karma event (without _id and createdAt)
   * @returns The created karma event with generated ID and timestamp
   */
  async createKarmaEvent(
    event: Omit<KarmaEvent, "_id" | "createdAt">,
  ): Promise<KarmaEvent> {
    const karmaEvent: KarmaEvent = {
      _id: new ObjectId(),
      ...event,
      createdAt: new Date(),
    };

    await this.karmaEventsCollection.insertOne(karmaEvent);

    return karmaEvent;
  }

  /**
   * Find karma events for a user in a family with cursor-based pagination
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @param limit - Maximum number of events to return
   * @param cursor - Optional cursor (ObjectId as string) for pagination
   * @returns Array of karma events sorted by createdAt descending
   */
  async findKarmaEvents(
    familyId: ObjectId,
    userId: ObjectId,
    limit: number,
    cursor?: string,
  ): Promise<KarmaEvent[]> {
    const query: {
      familyId: ObjectId;
      userId: ObjectId;
      _id?: { $lt: ObjectId };
    } = {
      familyId,
      userId,
    };

    // Cursor-based pagination using _id
    if (cursor) {
      try {
        query._id = { $lt: new ObjectId(cursor) };
      } catch {
        // Invalid cursor, ignore it
        logger.warn("Invalid cursor provided for karma events pagination", {
          cursor,
        });
      }
    }

    return this.karmaEventsCollection
      .find(query)
      .sort({ _id: -1 }) // Sort by _id descending (same as createdAt for ObjectId)
      .limit(limit)
      .toArray();
  }

  /**
   * Count total karma events for a user in a family
   *
   * @param familyId - The family ID
   * @param userId - The user ID
   * @returns Total count of karma events
   */
  async countKarmaEvents(
    familyId: ObjectId,
    userId: ObjectId,
  ): Promise<number> {
    return this.karmaEventsCollection.countDocuments({ familyId, userId });
  }
}
