import { HttpError } from "@lib/http-error";
import { toObjectId, validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { verifyMembership } from "../middleware";
import { emitMemberRemoved } from "../realtime/events/chat-events";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MembershipService } from "../services/membership.service";

/**
 * DELETE /:chatId/members/:userId - Remove a member from a group chat
 *
 * Requires authentication
 * - If removing self: No additional requirements
 * - If removing others: Admin role required
 *
 * Response (204): No Content
 * Response (400): Cannot remove from DM
 * Response (401): Authentication required
 * Response (403): Not a member or not admin when removing others
 * Response (404): Chat or member not found
 */
export function removeMemberRoute(): Router {
  const router = Router({ mergeParams: true });
  const chatRepository = new ChatRepository();
  const membershipRepository = new MembershipRepository();
  const membershipService = new MembershipService(
    chatRepository,
    membershipRepository,
  );

  // Async middleware wrapper to handle verifyMembership
  const asyncVerifyMembership = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    verifyMembership(req, res, next).catch(next);
  };

  router.delete(
    "/:chatId/members/:userId",
    authenticate,
    asyncVerifyMembership,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { chatId, userId } = req.params;
        const normalizedRemovedBy = validateObjectId(req.user.id, "userId");
        const normalizedUserToRemove = validateObjectId(userId, "userId");
        const normalizedChatId = validateObjectId(chatId, "chatId");
        const chatObjectId = toObjectId(normalizedChatId, "chatId");

        // Verify chat type before checking authorization
        const chat = await chatRepository.findById(chatObjectId);
        if (!chat) {
          throw HttpError.notFound("Chat not found");
        }
        if (chat.type !== "group") {
          throw HttpError.badRequest("Cannot remove members from DM");
        }

        // Check if removing self or removing others
        const isRemovingSelf = normalizedRemovedBy === normalizedUserToRemove;

        // If removing others, require admin role
        if (!isRemovingSelf) {
          if (req.membership?.role !== "admin") {
            throw HttpError.forbidden("Admin role required for this operation");
          }
        }

        await membershipService.removeMember(
          normalizedChatId,
          normalizedUserToRemove,
          normalizedRemovedBy,
        );

        // Broadcast member-removed event to remaining members
        const remainingMemberIds = (chat.memberIds || [])
          .filter((id) => id.toString() !== normalizedUserToRemove)
          .map((id) => id.toString());

        emitMemberRemoved(
          chatObjectId,
          chat.title || "Group Chat",
          normalizedUserToRemove,
          remainingMemberIds,
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
