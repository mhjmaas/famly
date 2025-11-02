import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@infra/mongo/client";
import { ClaimRepository } from "../repositories/claim.repository";
import { toClaimDTO } from "../lib/reward.mapper";

/**
 * GET /claims/:claimId - Get a specific claim
 *
 * Requires authentication and proper authorization
 * - Members can see their own claims
 * - Parents can see any claim in their family
 *
 * Response (200): ClaimDTO
 * Response (401): Authentication required
 * Response (403): Not authorized
 * Response (404): Claim not found
 */
export function getClaimRoute(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/claims/:claimId",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.claimId) {
          throw HttpError.badRequest("Missing claimId parameter");
        }

        const userId = new ObjectId(req.user.id);
        const familyId = new ObjectId(req.params.familyId);
        const claimId = new ObjectId(req.params.claimId);

        // Verify membership
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Get claim
        const mongoClient = getMongoClient();
        const claimRepository = new ClaimRepository(mongoClient);
        const claim = await claimRepository.findById(claimId);

        if (!claim) {
          throw HttpError.notFound("Claim not found");
        }

        // Verify claim belongs to this family
        if (!claim.familyId.equals(familyId)) {
          throw HttpError.forbidden("Claim does not belong to this family");
        }

        // Authorization: members can only see own claims, parents can see all
        if (membership.role !== FamilyRole.Parent && !claim.memberId.equals(userId)) {
          throw HttpError.forbidden("You can only view your own claims");
        }

        res.status(200).json(toClaimDTO(claim));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
