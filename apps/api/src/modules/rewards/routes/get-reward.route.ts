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
 * GET /rewards/:rewardId - Get reward details
 *
 * Requires authentication and family membership
 *
 * Response (200): RewardDetailsDTO
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Reward not found
 */
export function getRewardRoute(): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/rewards/:rewardId",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.rewardId) {
          throw HttpError.badRequest("Missing rewardId parameter");
        }

        const userId = new ObjectId(req.user.id);
        const familyId = new ObjectId(req.params.familyId);
        const rewardId = new ObjectId(req.params.rewardId);

        // Verify membership
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Get reward
        const mongoClient = getMongoClient();
        const rewardRepository = new RewardRepository(mongoClient);
        const metadataRepository = new MetadataRepository(mongoClient);
        const rewardService = new RewardService(
          rewardRepository,
          metadataRepository,
        );

        const reward = await rewardService.getReward(
          familyId,
          rewardId,
          userId,
        );

        res.status(200).json(reward);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
