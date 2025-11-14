import { randomUUID } from "node:crypto";
import { isHttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectIdString, validateObjectId } from "@lib/objectid-utils";
import { zodObjectId } from "@lib/zod-objectid";
import { ChatRepository } from "@modules/chat/repositories/chat.repository";
import { MembershipRepository } from "@modules/chat/repositories/membership.repository";
import { MessageRepository } from "@modules/chat/repositories/message.repository";
import { MembershipService } from "@modules/chat/services/membership.service";
import type { Socket } from "socket.io";
import { z } from "zod";
import { type Ack, ErrorCode, type ReceiptReadPayload } from "../types";

// Validation schema for read receipt events
const receiptSchema = z.object({
  chatId: zodObjectId,
  messageId: zodObjectId,
});

/**
 * Handle receipt:read event
 * Updates the user's read cursor and broadcasts read receipt to other members
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId and messageId
 * @param ack Acknowledgment callback
 */
export async function handleReceiptRead(
  socket: Socket,
  payload: ReceiptReadPayload,
  ack: (response: Ack<{ readAt: string }>) => void,
): Promise<void> {
  let userId: ObjectIdString | undefined;
  const correlationId = randomUUID();

  try {
    userId = validateObjectId(socket.data.userId as string, "userId");

    // Validate payload
    const validation = receiptSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Receipt read validation failed: ${validation.error.message}`,
      );
      return ack({
        ok: false,
        error: ErrorCode.VALIDATION_ERROR,
        message: validation.error.message,
        correlationId,
      });
    }

    const { chatId, messageId } = validation.data;

    // Use MembershipService to update read cursor (includes all validations)
    const chatRepo = new ChatRepository();
    const membershipRepo = new MembershipRepository();
    const messageRepo = new MessageRepository();
    const membershipService = new MembershipService(
      chatRepo,
      membershipRepo,
      messageRepo,
    );

    const updatedMembership = await membershipService.updateReadCursor(
      chatId,
      userId,
      messageId,
    );

    const readAt = updatedMembership.updatedAt || new Date().toISOString();

    // Broadcast receipt:update to room (including sender)
    socket.to(`chat:${chatId}`).emit("receipt:update", {
      chatId,
      messageId,
      userId,
      readAt,
    });

    logger.debug(
      `Socket ${socket.id}: User ${userId} marked message ${messageId} as read in chat ${chatId}`,
    );

    // Send success ack
    ack({
      ok: true,
      data: { readAt },
    });
  } catch (error) {
    const errorCorrelationId = randomUUID();
    logger.error(`Socket ${socket.id}: Receipt read error:`, {
      error: error instanceof Error ? error.message : String(error),
      userId: userId ?? socket.data.userId,
    });

    // Map HTTP errors to Socket.IO error codes
    if (isHttpError(error)) {
      let errorCode = ErrorCode.INTERNAL;

      if (error.statusCode === 404) {
        errorCode = ErrorCode.NOT_FOUND;
      } else if (error.statusCode === 403) {
        errorCode = ErrorCode.FORBIDDEN;
      } else if (error.statusCode === 400) {
        errorCode = ErrorCode.VALIDATION_ERROR;
      }

      return ack({
        ok: false,
        error: errorCode,
        message: error.message,
        correlationId: errorCorrelationId,
      });
    }

    ack({
      ok: false,
      error: ErrorCode.INTERNAL,
      message: "Internal server error",
      correlationId: errorCorrelationId,
    });
  }
}
