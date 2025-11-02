import { getMongoClient } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import type { RewardClaim } from "../domain/reward";
import { toClaimDTO } from "../lib/reward.mapper";
import { ClaimRepository } from "../repositories/claim.repository";

/**
 * GET /claims - List claims
 *
 * Requires authentication and family membership
 * - Children see only their own claims
 * - Parents see all family claims
 *
 * Query parameters:
 * - status?: 'pending' | 'completed' | 'cancelled' (optional filter)
 * - memberId?: string (optional, parent only)
 *
 * Response (200): ClaimDTO[]
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function listClaimsRoute(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/claims",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const userId = new ObjectId(req.user.id);
        const familyId = new ObjectId(req.params.familyId);

        // Verify membership
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Get claims
        const mongoClient = getMongoClient();
        const claimRepository = new ClaimRepository(mongoClient);

        let claims: RewardClaim[];
        if (membership.role === FamilyRole.Parent) {
          // Parents see all family claims
          claims = await claimRepository.findByFamily(familyId);
        } else {
          // Children see only their own claims
          claims = await claimRepository.findByMember(familyId, userId);
        }

        // Filter by status if provided
        const status = req.query.status as string | undefined;
        if (status && ["pending", "completed", "cancelled"].includes(status)) {
          claims = claims.filter((c) => c.status === status);
        }

        res.status(200).json(claims.map((c) => toClaimDTO(c)));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
