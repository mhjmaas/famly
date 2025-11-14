import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import type { Chat } from "../domain/chat";
import { toChatDTO } from "../lib/chat.mapper";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { ChatService } from "../services/chat.service";
import type { CreateChatInput } from "../validators/create-chat.validator";
import { validateCreateChat } from "../validators/create-chat.validator";

/**
 * POST / - Create a new chat (DM or group)
 *
 * Requires authentication
 *
 * Request body:
 * - type: string (required, 'dm' or 'group')
 * - memberIds: string[] (required, array of user IDs)
 * - title: string (optional, only for groups)
 *
 * For DMs:
 * - Creates a new DM if one doesn't exist, returns 201
 * - Returns existing DM if one already exists, returns 200
 *
 * For Groups:
 * - Creates a new group, returns 201
 *
 * Response (200/201): ChatDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 */
export function createChatRoute(): Router {
  const router = Router();
  const chatRepository = new ChatRepository();
  const membershipRepository = new MembershipRepository();
  const chatService = new ChatService(chatRepository, membershipRepository);

  router.post(
    "/",
    authenticate,
    validateCreateChat,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const input: CreateChatInput = req.body;

        let chat: Chat;
        let isNew = false;

        if (input.type === "dm") {
          // For DMs, memberIds should have exactly 1 user (the other user)
          const result = await chatService.createDM(
            req.user.id,
            input.memberIds[0],
          );
          chat = result.chat;
          isNew = result.isNew;
        } else {
          // For groups, memberIds are the additional members (not including creator)
          chat = await chatService.createGroup(
            req.user.id,
            input.memberIds,
            input.title ?? null,
          );

          isNew = true;
        }

        const statusCode = isNew ? 201 : 200;
        res.status(statusCode).json(toChatDTO(chat));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
