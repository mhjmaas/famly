import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { toMemberKarmaDTO } from "@modules/karma/lib/karma.mapper";
import { KarmaRepository } from "@modules/karma/repositories/karma.repository";
import { KarmaService } from "@modules/karma/services/karma.service";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";

/**
 * GET /members/:memberId/karma - Get member's karma balance (convenience route)
 *
 * This is a convenience alias for /karma/balance/:userId
 * Requires authentication and family membership
 *
 * Response (200): MemberKarmaDTO
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createGetMemberKarmaRoute(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/members/:memberId/karma",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.memberId) {
          throw HttpError.badRequest("Missing memberId parameter");
        }

        const requestingUserId = new ObjectId(req.user.id);
        const familyId = new ObjectId(req.params.familyId);
        const userId = new ObjectId(req.params.memberId);

        // Verify requesting user is a member
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          requestingUserId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Get karma balance using karma service
        const karmaRepository = new KarmaRepository();
        const karmaService = new KarmaService(
          karmaRepository,
          membershipRepository,
        );

        const memberKarma = await karmaService.getMemberKarma(
          familyId,
          userId,
          requestingUserId,
        );

        res.status(200).json(toMemberKarmaDTO(memberKarma));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
