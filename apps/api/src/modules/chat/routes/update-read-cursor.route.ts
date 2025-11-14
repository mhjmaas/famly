import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { verifyMembership } from "../middleware/verify-membership";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MessageRepository } from "../repositories/message.repository";
import { MembershipService } from "../services/membership.service";
import type { UpdateReadCursorInput } from "../validators/update-read-cursor.validator";
import { validateUpdateReadCursor } from "../validators/update-read-cursor.validator";

/**
 * PUT /v1/chats/:chatId/read-cursor - Update read cursor for a chat
 *
 * Requires authentication and chat membership
 *
 * Request body:
 * - messageId: string (required, valid ObjectId)
 *
 * Response (200): MembershipDTO with updated lastReadMessageId
 * Response (400): Validation error or message doesn't belong to chat
 * Response (401): Authentication required
 * Response (403): Not a member of this chat
 * Response (404): Message not found
 */
export function updateReadCursorRoute(): Router {
  const router = Router();
  const membershipRepository = new MembershipRepository();
  const messageRepository = new MessageRepository();
  const chatRepository = new ChatRepository();
  const membershipService = new MembershipService(
    chatRepository,
    membershipRepository,
    messageRepository,
  );

  router.put(
    "/:chatId/read-cursor",
    authenticate,
    validateUpdateReadCursor,
    verifyMembership,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const chatId = validateObjectId(req.params.chatId, "chatId");
        const userId = validateObjectId(req.user.id, "userId");
        const input: UpdateReadCursorInput = (req as any).validatedBody;
        const messageId = input.messageId;

        const membership = await membershipService.updateReadCursor(
          chatId,
          userId,
          messageId,
        );

        res.status(200).json(membership);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
