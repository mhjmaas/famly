import { HttpError } from "@lib/http-error";
import { toObjectId, validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import type { Membership } from "../domain/membership";
import { MembershipRepository } from "../repositories/membership.repository";

/**
 * Extend Express Request to include membership data
 */
declare global {
  namespace Express {
    interface Request {
      membership?: Membership;
    }
  }
}

/**
 * Middleware to verify that authenticated user is a member of the specified chat
 * Attaches membership data to req.membership for downstream use
 *
 * Expects chatId as a route parameter (req.params.chatId)
 * Expects authenticated user (req.user.id)
 */
export async function verifyMembership(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw HttpError.unauthorized("Authentication required");
    }

    if (!chatId) {
      throw HttpError.badRequest("Chat ID is required");
    }

    const normalizedChatId = validateObjectId(chatId, "chatId");
    const normalizedUserId = validateObjectId(userId, "userId");
    const chatObjectId = toObjectId(normalizedChatId, "chatId");
    const userObjectId = toObjectId(normalizedUserId, "userId");

    const membershipRepository = new MembershipRepository();
    const membership = await membershipRepository.findByUserAndChat(
      userObjectId,
      chatObjectId,
    );

    if (!membership) {
      throw HttpError.forbidden("You are not a member of this chat");
    }

    // Attach membership to request for downstream use
    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
}
