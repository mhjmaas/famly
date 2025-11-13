import { logger } from "@lib/logger";
import { getSocketIOServer } from "../server/socket-server";

/**
 * Base event emitter interface for typed event emission
 * Modules should define their own event payload types and use this interface
 */
export interface EventPayload {
  [key: string]: unknown;
}

/**
 * Emit an event to specific user rooms
 * This is the core function used by all module-specific event emitters
 *
 * @param eventName The event name (e.g., "task.created", "karma.awarded")
 * @param targetUserIds Array of user IDs to broadcast to
 * @param payload The event payload
 */
export function emitToUserRooms<T extends EventPayload>(
  eventName: string,
  targetUserIds: string[],
  payload: T,
): void {
  const io = getSocketIOServer();

  if (!io) {
    logger.warn(
      `Socket.IO server not initialized. Event "${eventName}" will not be broadcast.`,
    );
    return;
  }

  if (targetUserIds.length === 0) {
    logger.debug(
      `Event "${eventName}" has no target users, skipping broadcast`,
    );
    return;
  }

  try {
    // Emit to each user's room
    for (const userId of targetUserIds) {
      const userRoomName = `user:${userId}`;
      io.to(userRoomName).emit(eventName, payload);
    }

    logger.debug(
      `Event "${eventName}" broadcast to ${targetUserIds.length} users`,
      { targetUserIds },
    );
  } catch (error) {
    logger.error(
      `Failed to emit event "${eventName}":`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit an event to a specific chat room
 * Used for chat-specific broadcasts
 *
 * @param eventName The event name
 * @param roomName The room name (e.g., "chat:123")
 * @param payload The event payload
 */
export function emitToRoom<T extends EventPayload>(
  eventName: string,
  roomName: string,
  payload: T,
): void {
  const io = getSocketIOServer();

  if (!io) {
    logger.warn(
      `Socket.IO server not initialized. Event "${eventName}" will not be broadcast to room "${roomName}".`,
    );
    return;
  }

  try {
    io.to(roomName).emit(eventName, payload);
    logger.debug(`Event "${eventName}" broadcast to room "${roomName}"`);
  } catch (error) {
    logger.error(
      `Failed to emit event "${eventName}" to room "${roomName}":`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
