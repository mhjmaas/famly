import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, type Filter, ObjectId } from "mongodb";
import type {
  ActivityEvent,
  RecordActivityEventInput,
} from "../domain/activity-event";

export class ActivityEventRepository {
  private collection: Collection<ActivityEvent>;

  constructor() {
    this.collection = getDb().collection<ActivityEvent>("activity_events");
  }

  /**
   * Ensure indexes are created for the activity events collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for finding events by user, sorted by date descending
      await this.collection.createIndex(
        { userId: 1, createdAt: -1 },
        { name: "idx_user_date_desc" },
      );

      logger.info("Activity event indexes created successfully");
    } catch (error) {
      logger.error("Failed to create activity event indexes:", error);
      throw error;
    }
  }

  /**
   * Record a new activity event
   */
  async recordEvent(input: RecordActivityEventInput): Promise<ActivityEvent> {
    const event: ActivityEvent = {
      _id: new ObjectId(),
      userId: input.userId,
      type: input.type,
      detail: input.detail,
      title: input.title,
      description: input.description,
      metadata: input.metadata,
      createdAt: new Date(),
    };

    await this.collection.insertOne(event);

    return event;
  }

  /**
   * Find activity events for a user within an optional date range
   * Both startDate and endDate are optional
   * Returns up to 100 events, sorted by most recent first
   */
  async findByUserInDateRange(
    userId: ObjectId,
    startDate?: string, // Format: YYYY-MM-DD
    endDate?: string, // Format: YYYY-MM-DD
  ): Promise<ActivityEvent[]> {
    const query: Filter<ActivityEvent> = { userId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        // Start of day in UTC
        query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        // End of day in UTC
        query.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    return this.collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
  }
}
