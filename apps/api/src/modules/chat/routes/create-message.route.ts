import { HttpError } from "@lib/http-error";
import { toObjectId, validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { getSocketIOServer } from "@modules/realtime";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { emitNewMessageNotification } from "../realtime/events/chat-events";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageService } from "../services/message.service";
import type { CreateMessageInput } from "../validators/create-message.validator";
import { validateCreateMessage } from "../validators/create-message.validator";

/**
 * POST /v1/chats/:chatId/messages - Create a new message with idempotency support
 *
 * Requires authentication
 *
 * Request body:
 * - clientId: string (optional, for idempotency)
 * - body: string (required, 1-8000 chars)
 *
 * Returns 201 for new message, 200 for existing (idempotent)
 *
 * Response (200/201): MessageDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a member of this chat
 */
export function createMessageRoute(): Router {
  const router = Router({ mergeParams: true });
  const messageRepository = new MessageRepository();
  const membershipRepository = new MembershipRepository();
  const chatRepository = new ChatRepository();
  const messageService = new MessageService(
    messageRepository,
    membershipRepository,
    chatRepository,
  );

  router.post(
    "/:chatId/messages",
    authenticate,
    validateCreateMessage,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { chatId: chatIdParam } = req.params;

        const chatId = validateObjectId(chatIdParam, "chatId");
        const senderId = validateObjectId(req.user.id, "userId");

        const input: CreateMessageInput = (req as any).validatedBody;
        const chatObjectId = toObjectId(chatId, "chatId");
        const senderObjectId = toObjectId(senderId, "userId");

        // Verify user is a member of the chat
        const membership = await membershipRepository.findByUserAndChat(
          senderObjectId,
          chatObjectId,
        );
        if (!membership) {
          throw HttpError.forbidden("You are not a member of this chat");
        }

        // Create message
        const { message, isNew } = await messageService.createMessage(
          chatId,
          senderId,
          input.body,
          input.clientId,
        );

        // Broadcast message:new event to chat room if this is a new message
        if (isNew) {
          const io = getSocketIOServer();
          if (io) {
            io.to(`chat:${chatId}`).emit("message:new", {
              message,
            });
          }

          // Also send notification to all chat members via their user rooms
          // This ensures members not viewing the chat still get notified for unread badges
          const chat = await chatRepository.findById(chatObjectId);
          if (chat) {
            const memberIds = chat.memberIds.map((id) => id.toString());
            await emitNewMessageNotification(chatId, message, memberIds, true);
          }
        }

        // Return 201 for new messages, 200 for existing (idempotent)
        const statusCode = isNew ? 201 : 200;
        res.status(statusCode).json(message);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
