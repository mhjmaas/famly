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
import { validateSearchMessages } from "../validators/search-messages.validator";

/**
 * GET /v1/chats/search/messages - Search messages across user's chats
 *
 * Requires authentication
 *
 * Query parameters:
 * - q: string (required, search query)
 * - chatId: string (optional, limit to specific chat)
 * - cursor: string (optional, pagination cursor)
 * - limit: number (default 20, max 100)
 *
 * Response (200): { messages: MessageDTO[], nextCursor?: string }
 * Response (400): Validation error (missing q or invalid params)
 * Response (401): Authentication required
 */
export function searchMessagesRoute(): Router {
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
    "/search/messages",
    authenticate,
    validateSearchMessages,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);
        const searchParams = (req as any).searchParams;

        const response = await messageService.searchMessages(
          userId,
          searchParams.q,
          searchParams.chatId,
          searchParams.cursor,
          searchParams.limit,
        );

        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
