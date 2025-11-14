import { getMongoClient } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { toObjectId, validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { RewardService } from "../services/reward.service";

/**
 * POST /rewards/:rewardId/favourite - Toggle favourite status
 *
 * Requires authentication and family membership
 *
 * Request body:
 * - isFavourite: boolean (required)
 *
 * Response (200): RewardDetailsDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Reward not found
 */
export function toggleFavouriteRoute(): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/rewards/:rewardId/favourite",
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

        // Validate input
        if (typeof req.body?.isFavourite !== "boolean") {
          throw HttpError.badRequest(
            "isFavourite field is required and must be a boolean",
          );
        }

        const userId = validateObjectId(req.user.id, "userId");
        const familyId = validateObjectId(req.params.familyId, "familyId");
        const rewardId = validateObjectId(req.params.rewardId, "rewardId");
        const isFavourite = req.body.isFavourite;
        const mongoClient = getMongoClient();

        // Verify membership
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden("Not a member of this family");
        }

        // Verify reward exists
        const rewardRepository = new RewardRepository(mongoClient);
        const reward = await rewardRepository.findById(
          toObjectId(rewardId, "rewardId"),
        );

        if (!reward || reward.familyId.toString() !== familyId) {
          throw HttpError.notFound("Reward not found");
        }

        // Update favourite
        const metadataRepository = new MetadataRepository(mongoClient);
        await metadataRepository.upsertFavourite(
          toObjectId(familyId, "familyId"),
          toObjectId(rewardId, "rewardId"),
          toObjectId(userId, "userId"),
          isFavourite,
        );

        // Return updated reward details
        const rewardService = new RewardService(
          rewardRepository,
          metadataRepository,
        );

        const rewardDetails = await rewardService.getReward(
          familyId,
          rewardId,
          userId,
        );

        res.status(200).json(rewardDetails);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
