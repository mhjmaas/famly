import { logger } from "@lib/logger";
import type { ObjectId } from "mongodb";
import type { Server } from "socket.io";
import type { ChatDTO } from "../../domain/chat";

// Global reference to Socket.IO server instance
let ioInstance: Server | null = null;

/**
 * Set the global Socket.IO server instance
 * Call this during server initialization
 */
export function setSocketIOServer(io: Server): void {
  ioInstance = io;
  logger.info("Socket.IO server instance registered for chat events");
}

/**
 * Get the global Socket.IO server instance
 */
export function getSocketIOServer(): Server | null {
  return ioInstance;
}

/**
 * Emit a chat update event to specific members
 * Broadcasts to each member's user:<userId> room
 *
 * @param chat The full chat DTO to broadcast
 * @param targetMemberIds Optional array of member IDs to broadcast to. If not provided, broadcasts to all members in chat.memberIds
 */
export function emitChatUpdate(chat: ChatDTO, targetMemberIds?: string[]): void {
  const io = getSocketIOServer();

  if (!io) {
    logger.warn(
      `Socket.IO server not initialized. Chat update for ${chat._id} will not be broadcast.`,
    );
    return;
  }

  try {
    // Use targetMemberIds if provided, otherwise use chat.memberIds
    const membersToNotify = targetMemberIds || chat.memberIds || [];
    
    // Emit to each member's user room
    if (membersToNotify.length > 0) {
      for (const memberId of membersToNotify) {
        const userRoomName = `user:${memberId}`;
        io.to(userRoomName).emit("chat:update", {
          chat,
        });
      }
      logger.debug(
        `Chat update broadcast to ${membersToNotify.length} members of chat ${chat._id}`,
      );
    } else {
      // If no members provided, just log
      logger.debug(
        `Chat update event received but no members to broadcast to for chat ${chat._id}`,
      );
    }
  } catch (error) {
    logger.error(
      `Failed to emit chat update for ${chat._id}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a member added event to all members of a chat
 * Notifies existing members that a new member has been added
 *
 * @param chatId The chat ID
 * @param chatTitle The chat title (for context)
 * @param newMemberId The ID of the newly added member
 * @param newMemberRole The role of the newly added member
 * @param existingMemberIds Array of existing member IDs to notify
 */
export function emitMemberAdded(
  chatId: ObjectId,
  chatTitle: string,
  newMemberId: string,
  newMemberRole: "admin" | "member",
  existingMemberIds: string[],
): void {
  const io = getSocketIOServer();

  if (!io) {
    logger.warn(
      `Socket.IO server not initialized. Member added event for ${chatId} will not be broadcast.`,
    );
    return;
  }

  try {
    for (const memberId of existingMemberIds) {
      const userRoomName = `user:${memberId}`;
      io.to(userRoomName).emit("chat:member-added", {
        chatId: chatId.toString(),
        chatTitle,
        newMemberId,
        newMemberRole,
      });
    }

    logger.debug(
      `Member added event broadcast to ${existingMemberIds.length} members of chat ${chatId}`,
    );
  } catch (error) {
    logger.error(
      `Failed to emit member added event for ${chatId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Emit a member removed event to all members of a chat
 * Notifies remaining members that a member has been removed
 *
 * @param chatId The chat ID
 * @param chatTitle The chat title (for context)
 * @param removedMemberId The ID of the removed member
 * @param remainingMemberIds Array of remaining member IDs to notify
 */
export function emitMemberRemoved(
  chatId: ObjectId,
  chatTitle: string,
  removedMemberId: string,
  remainingMemberIds: string[],
): void {
  const io = getSocketIOServer();

  if (!io) {
    logger.warn(
      `Socket.IO server not initialized. Member removed event for ${chatId} will not be broadcast.`,
    );
    return;
  }

  try {
    for (const memberId of remainingMemberIds) {
      const userRoomName = `user:${memberId}`;
      io.to(userRoomName).emit("chat:member-removed", {
        chatId: chatId.toString(),
        chatTitle,
        removedMemberId,
      });
    }

    logger.debug(
      `Member removed event broadcast to ${remainingMemberIds.length} members of chat ${chatId}`,
    );
  } catch (error) {
    logger.error(
      `Failed to emit member removed event for ${chatId}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}
