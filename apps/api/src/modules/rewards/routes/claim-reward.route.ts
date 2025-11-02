import { getMongoClient } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { KarmaRepository } from "@modules/karma/repositories/karma.repository";
import { KarmaService } from "@modules/karma/services/karma.service";
import { TaskRepository } from "@modules/tasks/repositories/task.repository";
import { TaskService } from "@modules/tasks/services/task.service";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { ClaimRepository } from "../repositories/claim.repository";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { ClaimService } from "../services/claim.service";
import { validateClaimReward } from "../validators/claim-reward.validator";

/**
 * POST /rewards/:rewardId/claim - Claim a reward
 *
 * Requires authentication and family membership
 *
 * Response (201): ClaimDTO
 * Response (400): Validation error or insufficient karma
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Reward not found
 * Response (409): Duplicate pending claim
 */
export function claimRewardRoute(): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/rewards/:rewardId/claim",
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
        const rewardId = validateClaimReward(req.params.rewardId);

        // Verify membership
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Initialize services
        const mongoClient = getMongoClient();
        const rewardRepository = new RewardRepository(mongoClient);
        const claimRepository = new ClaimRepository(mongoClient);
        const metadataRepository = new MetadataRepository(mongoClient);
        const karmaRepository = new KarmaRepository();
        const karmaService = new KarmaService(
          karmaRepository,
          membershipRepository,
        );
        const taskRepository = new TaskRepository();
        const taskService = new TaskService(
          taskRepository,
          membershipRepository,
          karmaService,
        );

        const claimService = new ClaimService(
          claimRepository,
          rewardRepository,
          metadataRepository,
          karmaService,
          taskService,
        );

        // Create claim
        const claim = await claimService.createClaim(
          rewardId,
          familyId,
          userId,
        );

        res.status(201).json(claim);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
