import { logger } from "@lib/logger";
import { emitToUserRooms } from "@modules/realtime";
import type {
  ActivityEvent,
  ActivityEventType,
} from "../domain/activity-event";

/**
 * Event payload types for activity events
 */
export interface ActivityEventPayloads {
  "activity.created": {
    eventId: string;
    userId: string;
    type: ActivityEventType;
    detail?: string;
    title: string;
    description?: string;
    templateKey?: ActivityEvent["templateKey"];
    templateParams?: ActivityEvent["templateParams"];
    locale?: ActivityEvent["locale"];
    metadata?: {
      karma?: number;
    };
    createdAt: string;
  };
}

/**
 * Emit an activity.created event
 * Broadcasts when a new activity is recorded for a user
 *
 * @param event The activity event that was created
 */
export function emitActivityCreated(event: ActivityEvent): void {
  try {
    const payload: ActivityEventPayloads["activity.created"] = {
      eventId: event._id.toString(),
      userId: event.userId.toString(),
      type: event.type,
      detail: event.detail,
      title: event.title,
      description: event.description,
      templateKey: event.templateKey,
      templateParams: event.templateParams,
      locale: event.locale,
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    };

    // Emit to the user who owns the activity
    emitToUserRooms("activity.created", [event.userId.toString()], payload);

    logger.debug(`Emitted activity.created event for activity ${event._id}`, {
      eventId: event._id.toString(),
      userId: event.userId.toString(),
      type: event.type,
    });
  } catch (error) {
    logger.error(
      `Failed to emit activity.created event for activity ${event._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
