import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import type { ChatDTO } from "../domain/chat";
import { toChatDTO } from "../lib/chat.mapper";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { ChatService } from "../services/chat.service";

/**
 * GET /:chatId - Get a specific chat by ID
 *
 * Requires authentication and chat membership
 *
 * Path parameters:
 * - chatId: string (required, must be valid ObjectId)
 *
 * Response (200): ChatDTO
 * Response (400): Invalid chatId format
 * Response (401): Authentication required
 * Response (403): Not a member of this chat
 * Response (404): Chat not found
 */
export function getChatRoute(): Router {
  const router = Router({ mergeParams: true });
  const chatRepository = new ChatRepository();
  const membershipRepository = new MembershipRepository();
  const chatService = new ChatService(chatRepository, membershipRepository);

  router.get(
    "/:chatId",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { chatId: chatIdParam } = req.params;

        // Validate chatId format - must be a valid 24-character hex string (MongoDB ObjectId format)
        // We check the hex format first, then use ObjectId.isValid() as additional validation
        if (!/^[0-9a-fA-F]{24}$/.test(chatIdParam)) {
          throw HttpError.badRequest("Invalid chat ID format - must be a valid ObjectId");
        }

        if (!ObjectId.isValid(chatIdParam)) {
          throw HttpError.badRequest("Invalid chat ID format - must be a valid ObjectId");
        }

        const chatId = new ObjectId(chatIdParam);
        const userId = new ObjectId(req.user.id);

        // Get chat with membership verification
        const chat = await chatService.getChatById(chatId, userId);

        if (!chat) {
          // Check if it's a membership issue or not found
          const existingChat = await chatRepository.findById(chatId);

          if (!existingChat) {
            throw HttpError.notFound("Chat not found");
          }

          // Chat exists but user is not a member
          throw HttpError.forbidden("You are not a member of this chat");
        }

        const chatDTO: ChatDTO = toChatDTO(chat);
        res.status(200).json(chatDTO);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
