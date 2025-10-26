import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MessageService } from "../services/message.service";
import { validateListMessages } from "../validators/list-messages.validator";
import { verifyMembership } from "../middleware/verify-membership";

/**
 * GET /v1/chats/:chatId/messages - List messages for a chat
 *
 * Requires authentication and chat membership
 *
 * Query parameters (optional):
 * - before: string (pagination cursor, valid ObjectId)
 * - limit: number (default 50, max 200)
 *
 * Response (200): { messages: MessageDTO[], nextCursor?: string }
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a member of this chat
 */
export function listMessagesRoute(): Router {
  const router = Router();
  const messageRepository = new MessageRepository();
  const membershipRepository = new MembershipRepository();
  const chatRepository = new ChatRepository();
  const messageService = new MessageService(
    messageRepository,
    membershipRepository,
    chatRepository,
  );

  router.get(
    "/:chatId/messages",
    authenticate,
    validateListMessages,
    verifyMembership,
    async (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const chatId = new ObjectId(req.params.chatId);
        const userId = new ObjectId(req.user.id);
        const paginationParams = (req as any).paginationParams || {
          before: undefined,
          limit: 50,
        };

        const response = await messageService.listMessages(
          chatId,
          userId,
          paginationParams.before,
          paginationParams.limit,
        );

        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
