import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageService } from "../services/message.service";

/**
 * DELETE /v1/chats/:chatId/messages
 * Clear all messages in an AI chat
 *
 * Only allowed for AI chats. Requires user to be a member of the chat.
 *
 * Response (200): { deletedCount: number }
 * Response (401): Authentication required
 * Response (403): Not a member of this chat / Not an AI chat
 * Response (404): Chat not found
 */
export function clearMessagesRoute(): Router {
  const router = Router();
  const messageRepository = new MessageRepository();
  const membershipRepository = new MembershipRepository();
  const chatRepository = new ChatRepository();
  const messageService = new MessageService(
    messageRepository,
    membershipRepository,
    chatRepository,
  );

  router.delete(
    "/:chatId/messages",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const result = await messageService.clearMessages(
          req.params.chatId,
          req.user.id,
        );

        res.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
