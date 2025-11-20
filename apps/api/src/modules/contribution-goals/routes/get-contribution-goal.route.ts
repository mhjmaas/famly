import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toContributionGoalDTO } from "../lib/contribution-goal.mapper";
import { getContributionGoalService } from "../services/contribution-goal.service.instance";

/**
 * GET /families/:familyId/contribution-goals/:memberId - Get contribution goal for a member
 *
 * Requires authentication and family membership
 *
 * Response (200): ContributionGoalDTO
 * Response (404): Contribution goal not found
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function getContributionGoalRoute(): Router {
  const router = Router({ mergeParams: true });
  const contributionGoalService = getContributionGoalService();

  router.get(
    "/:memberId",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.memberId) {
          throw HttpError.badRequest("Missing memberId parameter");
        }

        const familyId = req.params.familyId;
        const memberId = req.params.memberId;

        const goal = await contributionGoalService.getContributionGoal(
          familyId,
          userId,
          memberId,
        );

        if (!goal) {
          res.status(404).json({ message: "Contribution goal not found" });
          return;
        }

        res.status(200).json(toContributionGoalDTO(goal));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
