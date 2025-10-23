import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toChatDTO } from "../lib/chat.mapper";
import { requireAdmin, verifyMembership } from "../middleware";
import { ChatRepository } from "../repositories/chat.repository";
import { MembershipRepository } from "../repositories/membership.repository";
import { MembershipService } from "../services/membership.service";
import type { AddMembersInput } from "../validators/add-members.validator";
import { validateAddMembers } from "../validators/add-members.validator";

/**
 * POST /:chatId/members - Add new members to a group chat
 *
 * Requires authentication and admin role
 *
 * Request body:
 * - userIds: string[] (required, array of user IDs to add)
 *
 * Response (200): Updated ChatDTO
 * Response (400): Validation error or cannot add to DM
 * Response (401): Authentication required
 * Response (403): Not a member or not admin
 * Response (404): Chat not found
 */
export function addMembersRoute(): Router {
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

  router.post(
    "/:chatId/members",
    authenticate,
    asyncVerifyMembership,
    validateAddMembers,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const { chatId } = req.params;
        const input: AddMembersInput = req.body;
        const addedBy = new ObjectId(req.user.id);
        const chatObjectId = new ObjectId(chatId);

        // Verify chat type before checking admin role
        const chat = await chatRepository.findById(chatObjectId);
        if (!chat) {
          throw HttpError.notFound("Chat not found");
        }
        if (chat.type !== "group") {
          throw HttpError.badRequest("Cannot add members to DM");
        }

        // Now check for admin role
        if (req.membership?.role !== "admin") {
          throw HttpError.forbidden("Admin role required for this operation");
        }

        const userIds = input.userIds.map((id) => new ObjectId(id));

        const updatedChat = await membershipService.addMembers(
          chatObjectId,
          userIds,
          addedBy,
        );

        res.status(200).json(toChatDTO(updatedChat));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
