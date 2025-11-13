import { logger } from "@lib/logger";
import type { Socket } from "socket.io";

/**
 * Join a socket to a specific room
 *
 * @param socket Socket instance
 * @param roomName Room name to join
 */
export async function joinRoom(
  socket: Socket,
  roomName: string,
): Promise<void> {
  try {
    await socket.join(roomName);
    logger.debug(`Socket ${socket.id}: Joined room "${roomName}"`);
  } catch (error) {
    logger.error(
      `Socket ${socket.id}: Failed to join room "${roomName}":`,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Leave a specific room
 *
 * @param socket Socket instance
 * @param roomName Room name to leave
 */
export async function leaveRoom(
  socket: Socket,
  roomName: string,
): Promise<void> {
  try {
    await socket.leave(roomName);
    logger.debug(`Socket ${socket.id}: Left room "${roomName}"`);
  } catch (error) {
    logger.error(
      `Socket ${socket.id}: Failed to leave room "${roomName}":`,
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Get user room name for a given userId
 *
 * @param userId User ID
 * @returns User room name in format "user:<userId>"
 */
export function getUserRoomName(userId: string): string {
  return `user:${userId}`;
}

/**
 * Get chat room name for a given chatId
 *
 * @param chatId Chat ID
 * @returns Chat room name in format "chat:<chatId>"
 */
export function getChatRoomName(chatId: string): string {
  return `chat:${chatId}`;
}
