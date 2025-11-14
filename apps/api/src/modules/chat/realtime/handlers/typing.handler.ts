import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import { zodObjectId } from "@lib/zod-objectid";
import { MembershipRepository } from "@modules/chat/repositories/membership.repository";
import type { Socket } from "socket.io";
import { z } from "zod";
import type { TypingStartPayload, TypingStopPayload } from "../types";

// Validation schema for typing events
const typingSchema = z.object({
  chatId: zodObjectId,
});

/**
 * Handle typing:start event
 * Broadcasts to room members that a user is typing
 * Fire-and-forget (no acknowledgment for performance)
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId
 */
export async function handleTypingStart(
  socket: Socket,
  payload: TypingStartPayload,
): Promise<void> {
  let userId: ObjectIdString | undefined;

  try {
    userId = validateObjectId(socket.data.userId as string, "userId");
    // Validate payload
    const validation = typingSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Typing start validation failed: ${validation.error.message}`,
      );
      return; // Fire-and-forget: silently fail on validation error
    }

    const { chatId } = validation.data;
    const userObjectId = toObjectId(userId, "userId");
    const chatObjectId = toObjectId(chatId, "chatId");

    // Verify user is a member of the chat
    const membershipRepo = new MembershipRepository();
    const membership = await membershipRepo.findByUserAndChat(
      userObjectId,
      chatObjectId,
    );

    if (!membership) {
      logger.debug(
        `Socket ${socket.id}: User ${userId} is not a member of chat ${chatId} (typing start)`,
      );
      return; // Fire-and-forget: silently fail for non-members
    }

    // Broadcast typing:update to room (excluding sender)
    socket.to(`chat:${chatId}`).emit("typing:update", {
      chatId,
      userId,
      state: "start",
    });

    logger.debug(
      `Socket ${socket.id}: User ${userId} started typing in chat ${chatId}`,
    );
  } catch (error) {
    logger.error(`Socket ${socket.id}: Typing start error:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId ?? socket.data.userId,
    });
    // Fire-and-forget: don't send error to client
  }
}

/**
 * Handle typing:stop event
 * Broadcasts to room members that a user stopped typing
 * Fire-and-forget (no acknowledgment for performance)
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId
 */
export async function handleTypingStop(
  socket: Socket,
  payload: TypingStopPayload,
): Promise<void> {
  let userId: ObjectIdString | undefined;

  try {
    userId = validateObjectId(socket.data.userId as string, "userId");
    // Validate payload
    const validation = typingSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Typing stop validation failed: ${validation.error.message}`,
      );
      return; // Fire-and-forget: silently fail on validation error
    }

    const { chatId } = validation.data;
    const userObjectId = toObjectId(userId, "userId");
    const chatObjectId = toObjectId(chatId, "chatId");

    // Verify user is a member of the chat
    const membershipRepo = new MembershipRepository();
    const membership = await membershipRepo.findByUserAndChat(
      userObjectId,
      chatObjectId,
    );

    if (!membership) {
      logger.debug(
        `Socket ${socket.id}: User ${userId} is not a member of chat ${chatId} (typing stop)`,
      );
      return; // Fire-and-forget: silently fail for non-members
    }

    // Broadcast typing:update to room (excluding sender)
    socket.to(`chat:${chatId}`).emit("typing:update", {
      chatId,
      userId,
      state: "stop",
    });

    logger.debug(
      `Socket ${socket.id}: User ${userId} stopped typing in chat ${chatId}`,
    );
  } catch (error) {
    logger.error(`Socket ${socket.id}: Typing stop error:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId ?? socket.data.userId,
    });
    // Fire-and-forget: don't send error to client
  }
}
