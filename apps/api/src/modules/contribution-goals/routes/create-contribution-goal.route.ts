import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toContributionGoalDTO } from "../lib/contribution-goal.mapper";
import { getContributionGoalService } from "../services/contribution-goal.service.instance";
import { validateCreateContributionGoal } from "../validators/create-contribution-goal.validator";

/**
 * POST /families/:familyId/contribution-goals - Create a new contribution goal
 *
 * Requires authentication and parent role
 *
 * Request body:
 * - memberId: string (required, ObjectId)
 * - title: string (required, max 200 chars)
 * - description: string (required, max 2000 chars)
 * - maxKarma: number (required, 1-10000)
 *
 * Response (201): ContributionGoalDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a parent or member not in family
 */
export function createContributionGoalRoute(): Router {
  const router = Router({ mergeParams: true });
  const contributionGoalService = getContributionGoalService();

  router.post(
    "/",
    authenticate,
    validateCreateContributionGoal,
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

        const familyId = req.params.familyId;

        const goal = await contributionGoalService.createContributionGoal(
          familyId,
          userId,
          req.body,
        );

        res.status(201).json(toContributionGoalDTO(goal));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
