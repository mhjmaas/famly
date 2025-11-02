import { getMongoClient } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { RewardService } from "../services/reward.service";
import { validateCreateReward } from "../validators/create-reward.validator";

/**
 * POST /rewards - Create a new reward
 *
 * Requires authentication, family membership, and parent role
 *
 * Request body:
 * - name: string (required, 1-100 chars)
 * - karmaCost: number (required, 1-1000)
 * - description?: string (optional, max 500 chars)
 * - imageUrl?: string (optional, valid HTTP(S) URL)
 *
 * Response (201): RewardDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a parent or not a family member
 */
export function createRewardRoute(): Router {
  const router = Router({ mergeParams: true });

  router.post(
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

        // Authorize parent role
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership || membership.role !== FamilyRole.Parent) {
          throw HttpError.forbidden("Only parents can create rewards");
        }

        // Validate input
        const input = validateCreateReward(req.body);

        // Create reward
        const mongoClient = getMongoClient();
        const rewardRepository = new RewardRepository(mongoClient);
        const metadataRepository = new MetadataRepository(mongoClient);
        const rewardService = new RewardService(
          rewardRepository,
          metadataRepository,
        );

        const reward = await rewardService.createReward(
          familyId,
          userId,
          input,
        );

        res.status(201).json(reward);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
