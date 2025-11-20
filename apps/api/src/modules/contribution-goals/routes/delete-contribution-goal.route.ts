import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { getContributionGoalService } from "../services/contribution-goal.service.instance";

/**
 * DELETE /families/:familyId/contribution-goals/:memberId - Delete contribution goal
 *
 * Requires authentication and parent role
 *
 * Response (204): No content
 * Response (401): Authentication required
 * Response (403): Not a parent
 * Response (404): Contribution goal not found
 */
export function deleteContributionGoalRoute(): Router {
  const router = Router({ mergeParams: true });
  const contributionGoalService = getContributionGoalService();

  router.delete(
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

        await contributionGoalService.deleteContributionGoal(
          familyId,
          userId,
          memberId,
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
