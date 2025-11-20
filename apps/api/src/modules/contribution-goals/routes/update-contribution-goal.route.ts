import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toContributionGoalDTO } from "../lib/contribution-goal.mapper";
import { getContributionGoalService } from "../services/contribution-goal.service.instance";
import { validateUpdateContributionGoal } from "../validators/update-contribution-goal.validator";

/**
 * PUT /families/:familyId/contribution-goals/:memberId - Update contribution goal
 *
 * Requires authentication and parent role
 *
 * Request body:
 * - title?: string (optional, max 200 chars)
 * - description?: string (optional, max 2000 chars)
 * - maxKarma?: number (optional, 1-10000)
 *
 * Response (200): ContributionGoalDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a parent
 * Response (404): Contribution goal not found
 */
export function updateContributionGoalRoute(): Router {
  const router = Router({ mergeParams: true });
  const contributionGoalService = getContributionGoalService();

  router.put(
    "/:memberId",
    authenticate,
    validateUpdateContributionGoal,
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

        const goal = await contributionGoalService.updateContributionGoal(
          familyId,
          userId,
          memberId,
          req.body,
        );

        res.status(200).json(toContributionGoalDTO(goal));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
