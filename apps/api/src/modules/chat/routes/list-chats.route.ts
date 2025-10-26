import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import type { ListChatsResponse } from "../domain/chat";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { ChatService } from "../services/chat.service";
import { validateListChats } from "../validators/list-chats.validator";

/**
 * GET / - List all chats for the authenticated user
 *
 * Requires authentication
 *
 * Query parameters (optional):
 * - cursor: string (pagination cursor, must be valid ObjectId)
 * - limit: number (default 20, max 100)
 *
 * Response (200): ListChatsResponse with array of ChatWithPreviewDTO and optional nextCursor
 * Response (400): Validation error (invalid cursor or limit)
 * Response (401): Authentication required
 */
export function listChatsRoute(): Router {
  const router = Router();
  const chatRepository = new ChatRepository();
  const membershipRepository = new MembershipRepository();
  const messageRepository = new MessageRepository();
  const chatService = new ChatService(chatRepository, membershipRepository, messageRepository);

  router.get(
    "/",
    authenticate,
    validateListChats,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);
        const paginationParams = (req as any).paginationParams || {
          cursor: undefined,
          limit: 20,
        };

        const response: ListChatsResponse = await chatService.listUserChats(
          userId,
          paginationParams.cursor,
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
