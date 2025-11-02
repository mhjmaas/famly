import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@infra/mongo/client";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { RewardService } from "../services/reward.service";

/**
 * GET /rewards - List all rewards for a family
 *
 * Requires authentication and family membership
 *
 * Query parameters:
 * - memberId?: string (optional, filter by member favourites)
 *
 * Response (200): RewardDTO[]
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function listRewardsRoute(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/rewards",
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

        // List rewards
        const mongoClient = getMongoClient();
        const rewardRepository = new RewardRepository(mongoClient);
        const metadataRepository = new MetadataRepository(mongoClient);
        const rewardService = new RewardService(
          rewardRepository,
          metadataRepository,
        );

        const rewards = await rewardService.listRewards(
          familyId,
          userId,
        );

        res.status(200).json(rewards);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
