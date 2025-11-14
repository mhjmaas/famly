import { getMongoClient } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { RewardService } from "../services/reward.service";

/**
 * DELETE /rewards/:rewardId - Delete a reward
 *
 * Requires authentication, family membership, and parent role
 * Cannot delete reward with pending claims
 *
 * Response (204): Success (no content)
 * Response (401): Authentication required
 * Response (403): Not a parent or not a family member
 * Response (404): Reward not found
 * Response (409): Reward has pending claims
 */
export function deleteRewardRoute(): Router {
  const router = Router({ mergeParams: true });

  router.delete(
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

        const userId = validateObjectId(req.user.id, "userId");
        const familyId = validateObjectId(req.params.familyId, "familyId");
        const rewardId = validateObjectId(req.params.rewardId, "rewardId");

        // Authorize parent role
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership || membership.role !== FamilyRole.Parent) {
          throw HttpError.forbidden("Only parents can delete rewards");
        }

        // Delete reward
        const mongoClient = getMongoClient();
        const rewardRepository = new RewardRepository(mongoClient);
        const metadataRepository = new MetadataRepository(mongoClient);
        const rewardService = new RewardService(
          rewardRepository,
          metadataRepository,
        );

        await rewardService.deleteReward(familyId, rewardId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
