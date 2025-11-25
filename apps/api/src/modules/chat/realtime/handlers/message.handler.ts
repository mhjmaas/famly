import { logger } from "@lib/logger";
import { toObjectId, validateObjectId } from "@lib/objectid-utils";
import { zodObjectId } from "@lib/zod-objectid";
import { ChatRepository } from "@modules/chat/repositories/chat.repository";
import { MembershipRepository } from "@modules/chat/repositories/membership.repository";
import { MessageRepository } from "@modules/chat/repositories/message.repository";
import { MessageService } from "@modules/chat/services/message.service";
import type { Socket } from "socket.io";
import { z } from "zod";
import { emitNewMessageNotification } from "../events/chat-events";
import type { Ack, MessageSendPayload } from "../types";
import { ErrorCode } from "../types";
import { getRateLimiter } from "../utils/rate-limiter";

// Validation schema for message send
const messageSendSchema = z.object({
  chatId: zodObjectId,
  clientId: z.string().min(1, "clientId is required"),
  body: z
    .string()
    .min(1, "Message body is required")
    .max(8000, "Message body must be 8000 characters or less"),
});

/**
 * Handle message:send event
 * Creates a new message in the chat with idempotency via clientId
 * Broadcasts the message to all room members
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload with chatId, clientId, and body
 * @param ack Acknowledgment callback with serverId
 */
export async function handleMessageSend(
  socket: Socket,
  payload: MessageSendPayload,
  ack: (response: Ack<{ clientId: string; serverId: string }>) => void,
): Promise<void> {
  const userId = socket.data.userId as string;
  const correlationId = crypto.randomUUID();

  try {
    // Validate payload
    const validation = messageSendSchema.safeParse(payload);
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Message send validation failed: ${validation.error.message}`,
      );
      const firstError = validation.error.issues[0];
      ack({
        ok: false,
        error: ErrorCode.VALIDATION_ERROR,
        message: firstError?.message || "Invalid message payload",
        correlationId,
      });
      return;
    }

    const { chatId, clientId, body } = validation.data;
    const normalizedUserId = validateObjectId(userId, "userId");
    const userObjectId = toObjectId(normalizedUserId, "userId");
    const chatObjectId = toObjectId(chatId, "chatId");

    // Check rate limit
    const rateLimiter = getRateLimiter();
    if (!rateLimiter.checkLimit(userId)) {
      logger.debug(
        `Socket ${socket.id}: User ${userId} rate limited (10 messages per 10s)`,
      );
      ack({
        ok: false,
        error: ErrorCode.RATE_LIMITED,
        message: "Too many messages. Max 10 messages per 10 seconds",
        correlationId,
      });
      return;
    }

    // Verify user is a member of the chat
    const membershipRepo = new MembershipRepository();
    const membership = await membershipRepo.findByUserAndChat(
      userObjectId,
      chatObjectId,
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

    // Create message with idempotency (via clientId)
    const messageRepo = new MessageRepository();
    const chatRepo = new ChatRepository();
    const messageService = new MessageService(
      messageRepo,
      membershipRepo,
      chatRepo,
    );
    const result = await messageService.createMessage(
      chatId,
      normalizedUserId,
      body,
      clientId,
    );

    // Log message creation or idempotency hit
    if (result.isNew) {
      logger.debug(
        `Socket ${socket.id}: Message created ${result.message._id} (clientId: ${clientId})`,
      );

      // Broadcast message:new to all room members (those currently viewing the chat)
      socket.to(`chat:${chatId}`).emit("message:new", {
        message: result.message,
      });

      // Also send notification to all chat members via their user rooms
      // This ensures members not viewing the chat still get notified for unread badges
      const chat = await chatRepo.findById(chatObjectId);
      if (chat) {
        const memberIds = chat.memberIds.map((id) => id.toString());
        await emitNewMessageNotification(
          chatId,
          result.message,
          memberIds,
          true,
        );
      }
    } else {
      logger.debug(
        `Socket ${socket.id}: Idempotent message send - existing message ${result.message._id} (clientId: ${clientId})`,
      );
    }

    // Send acknowledgment with both clientId and serverId
    ack({
      ok: true,
      data: {
        clientId,
        serverId: result.message._id.toString(),
      },
    });
  } catch (error) {
    logger.error(
      `Socket ${socket.id}: Message send error:`,
      error instanceof Error ? error.message : String(error),
    );
    ack({
      ok: false,
      error: ErrorCode.INTERNAL,
      message: "Failed to send message",
      correlationId,
    });
  }
}
