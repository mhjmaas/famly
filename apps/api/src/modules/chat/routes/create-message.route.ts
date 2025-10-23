import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import type { CreateMessageInput } from "../validators/create-message.validator";
import { validateCreateMessage } from "../validators/create-message.validator";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageService } from "../services/message.service";

/**
 * POST /v1/messages - Create a new message with idempotency support
 *
 * Requires authentication
 *
 * Request body:
 * - chatId: string (required, valid ObjectId)
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
  const router = Router();
  const messageRepository = new MessageRepository();
  const membershipRepository = new MembershipRepository();
  const chatRepository = new ChatRepository();
  const messageService = new MessageService(
    messageRepository,
    membershipRepository,
    chatRepository,
  );

  router.post(
    "/messages",
    authenticate,
    validateCreateMessage,
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const input: CreateMessageInput = (req as any).validatedBody;
        const senderId = new ObjectId(req.user.id);
        const chatId = new ObjectId(input.chatId);

        // Verify user is a member of the chat
        const membership = await membershipRepository.findByUserAndChat(
          senderId,
          chatId,
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
