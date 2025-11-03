import { logger } from "@lib/logger";
import type { ObjectId } from "mongodb";
import type {
  ActivityEvent,
  ActivityEventType,
} from "../domain/activity-event";
import type { ActivityEventRepository } from "../repositories/activity-event.repository";

export interface RecordEventInput {
  userId: ObjectId;
  type: ActivityEventType;
  title: string;
  description?: string;
  metadata?: {
    karma?: number;
  };
}

export class ActivityEventService {
  constructor(private activityEventRepository: ActivityEventRepository) {}

  /**
   * Record a new activity event
   * Utility method for other modules to easily create activity events
   *
   * @param input - Event details including userId, type, title, description, and metadata
   * @returns The created activity event
   */
  async recordEvent(input: RecordEventInput): Promise<ActivityEvent> {
    try {
      logger.debug("Recording activity event", {
        userId: input.userId.toString(),
        type: input.type,
        title: input.title,
      });

      const event = await this.activityEventRepository.recordEvent({
        userId: input.userId,
        type: input.type,
        title: input.title,
        description: input.description,
        metadata: input.metadata,
      });

      logger.info("Activity event recorded successfully", {
        eventId: event._id.toString(),
        userId: input.userId.toString(),
        type: input.type,
      });

      return event;
    } catch (error) {
      logger.error("Failed to record activity event", {
        userId: input.userId.toString(),
        type: input.type,
        error,
      });
      throw error;
    }
  }

  /**
   * Get activity events for a user with optional date range filtering
   *
   * @param userId - The user ID whose events to retrieve
   * @param startDate - Optional start date in YYYY-MM-DD format
   * @param endDate - Optional end date in YYYY-MM-DD format
   * @returns Array of activity events (up to 100), sorted by most recent first
   */
  async getEventsForUser(
    userId: ObjectId,
    startDate?: string,
    endDate?: string,
  ): Promise<ActivityEvent[]> {
    try {
      logger.debug("Fetching activity events for user", {
        userId: userId.toString(),
        startDate,
        endDate,
      });

      const events = await this.activityEventRepository.findByUserInDateRange(
        userId,
        startDate,
        endDate,
      );

      logger.debug("Activity events fetched successfully", {
        userId: userId.toString(),
        count: events.length,
      });

      return events;
    } catch (error) {
      logger.error("Failed to fetch activity events", {
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }
}
