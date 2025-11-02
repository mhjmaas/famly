import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { getMongoClient } from "@infra/mongo/client";
import { KarmaRepository } from "@modules/karma/repositories/karma.repository";
import { KarmaService } from "@modules/karma/services/karma.service";
import { TaskRepository } from "@modules/tasks/repositories/task.repository";
import { TaskService } from "@modules/tasks/services/task.service";
import { ClaimRepository } from "../repositories/claim.repository";
import { MetadataRepository } from "../repositories/metadata.repository";
import { RewardRepository } from "../repositories/reward.repository";
import { ClaimService } from "../services/claim.service";

/**
 * DELETE /claims/:claimId - Cancel a claim
 *
 * Requires authentication and family membership
 * - Members can cancel their own pending claims
 * - Parents can cancel any pending claim in the family
 *
 * Response (200): ClaimDTO
 * Response (401): Authentication required
 * Response (403): Not authorized to cancel this claim
 * Response (404): Claim not found
 * Response (409): Claim is not pending
 */
export function cancelClaimRoute(): Router {
  const router = Router({ mergeParams: true });

  router.delete(
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

        // Check authorization on claim
        const claimRepository = new ClaimRepository(mongoClient);
        const claim = await claimRepository.findById(claimId);

        if (!claim) {
          throw HttpError.notFound("Claim not found");
        }

        if (claim.familyId.toString() !== familyId.toString()) {
          throw HttpError.forbidden("Claim not found in this family");
        }

        // Check if user is authorized to cancel
        const isOwnClaim = claim.memberId.toString() === userId.toString();
        const isParent = membership.role === FamilyRole.Parent;

        if (!isOwnClaim && !isParent) {
          throw HttpError.forbidden(
            "Only the claim owner or parents can cancel claims",
          );
        }

        // Initialize services
        const rewardRepository = new RewardRepository(mongoClient);
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

        // Cancel claim
        const cancelledClaim = await claimService.cancelClaim(claimId, userId);

        res.status(200).json(cancelledClaim);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
