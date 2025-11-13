import { logger } from "@lib/logger";
import { emitToUserRooms } from "@modules/realtime";
import type { KarmaEvent } from "../domain/karma";

/**
 * Event payload types for karma events
 */
export interface KarmaEventPayloads {
  "karma.awarded": {
    eventId: string;
    familyId: string;
    userId: string;
    amount: number;
    source: string;
    description: string;
    event: KarmaEvent;
  };
  "karma.deducted": {
    eventId: string;
    familyId: string;
    userId: string;
    amount: number;
    description: string;
    event: KarmaEvent;
  };
}

/**
 * Emit a karma.awarded event
 * Broadcasts when karma is awarded to a user
 *
 * @param karmaEvent The karma event that was created
 */
export function emitKarmaAwarded(karmaEvent: KarmaEvent): void {
  try {
    const targetUserId = karmaEvent.userId.toString();

    const payload: KarmaEventPayloads["karma.awarded"] = {
      eventId: karmaEvent._id.toString(),
      familyId: karmaEvent.familyId.toString(),
      userId: targetUserId,
      amount: karmaEvent.amount,
      source: karmaEvent.source,
      description: karmaEvent.description,
      event: karmaEvent,
    };

    emitToUserRooms("karma.awarded", [targetUserId], payload);

    logger.debug(`Emitted karma.awarded event for user ${targetUserId}`, {
      eventId: karmaEvent._id.toString(),
      amount: karmaEvent.amount,
    });
  } catch (error) {
    logger.error(
      `Failed to emit karma.awarded event:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a karma.deducted event
 * Broadcasts when karma is deducted from a user
 *
 * @param karmaEvent The karma event that was created (with negative amount)
 */
export function emitKarmaDeducted(karmaEvent: KarmaEvent): void {
  try {
    const targetUserId = karmaEvent.userId.toString();

    const payload: KarmaEventPayloads["karma.deducted"] = {
      eventId: karmaEvent._id.toString(),
      familyId: karmaEvent.familyId.toString(),
      userId: targetUserId,
      amount: Math.abs(karmaEvent.amount), // Convert to positive for display
      description: karmaEvent.description,
      event: karmaEvent,
    };

    emitToUserRooms("karma.deducted", [targetUserId], payload);

    logger.debug(`Emitted karma.deducted event for user ${targetUserId}`, {
      eventId: karmaEvent._id.toString(),
      amount: Math.abs(karmaEvent.amount),
    });
  } catch (error) {
    logger.error(
      `Failed to emit karma.deducted event:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
