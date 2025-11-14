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
import type { Ack, RoomJoinPayload, RoomLeavePayload } from "../types";
import { ErrorCode } from "../types";

// Validation schemas
const roomJoinSchema = z.object({
  chatId: zodObjectId,
});

const roomLeaveSchema = z.object({
  chatId: zodObjectId,
});

/**
 * Handle room:join event
 * User joins a specific chat room to receive messages and real-time events
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId
 * @param ack Acknowledgment callback
 */
export async function handleRoomJoin(
  socket: Socket,
  payload: RoomJoinPayload,
  ack: (response: Ack) => void,
): Promise<void> {
  let userId: ObjectIdString | undefined;
  const correlationId = crypto.randomUUID();

  try {
    userId = validateObjectId(socket.data.userId as string, "userId");
    // Validate payload
    const validation = roomJoinSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Room join validation failed: ${validation.error.message}`,
      );
      ack({
        ok: false,
        error: ErrorCode.VALIDATION_ERROR,
        message: "Invalid chatId format",
        correlationId,
      });
      return;
    }

    const { chatId } = validation.data;
    const membershipRepo = new MembershipRepository();

    // Verify user is a member of the chat
    const membership = await membershipRepo.findByUserAndChat(
      toObjectId(userId, "userId"),
      toObjectId(chatId, "chatId"),
    );

    if (!membership) {
      logger.debug(
        `Socket ${socket.id}: User ${userId} is not a member of chat ${chatId}`,
      );
      ack({
        ok: false,
        error: ErrorCode.FORBIDDEN,
        message: "You are not a member of this chat",
        correlationId,
      });
      return;
    }

    // Join socket to chat room
    socket.join(`chat:${chatId}`);
    logger.debug(
      `Socket ${socket.id}: User ${userId} joined room chat:${chatId}`,
    );

    ack({ ok: true });
  } catch (error) {
    logger.error(`Socket ${socket.id}: Room join error:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId ?? socket.data.userId,
    });
    ack({
      ok: false,
      error: ErrorCode.INTERNAL,
      message: "Failed to join room",
      correlationId,
    });
  }
}

/**
 * Handle room:leave event
 * User leaves a specific chat room, stopping real-time event delivery
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId
 * @param ack Acknowledgment callback
 */
export async function handleRoomLeave(
  socket: Socket,
  payload: RoomLeavePayload,
  ack: (response: Ack) => void,
): Promise<void> {
  let userId: ObjectIdString | undefined;
  const correlationId = crypto.randomUUID();

  try {
    userId = validateObjectId(socket.data.userId as string, "userId");
    // Validate payload
    const validation = roomLeaveSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Room leave validation failed: ${validation.error.message}`,
      );
      ack({
        ok: false,
        error: ErrorCode.VALIDATION_ERROR,
        message: "Invalid chatId format",
        correlationId,
      });
      return;
    }

    const { chatId } = validation.data;

    // Leave socket from chat room
    socket.leave(`chat:${chatId}`);
    logger.debug(
      `Socket ${socket.id}: User ${userId} left room chat:${chatId}`,
    );

    ack({ ok: true });
  } catch (error) {
    logger.error(`Socket ${socket.id}: Room leave error:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId ?? socket.data.userId,
    });
    ack({
      ok: false,
      error: ErrorCode.INTERNAL,
      message: "Failed to leave room",
      correlationId,
    });
  }
}
