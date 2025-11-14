import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { isValidObjectId, validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import type { KarmaService } from "../services/karma.service";

/**
 * Get karma history route
 *
 * GET /v1/families/:familyId/karma/history/:userId
 *
 * Returns paginated karma event history for a user in the specified family
 * Any family member can view any other family member's karma history
 *
 * Query params:
 * - limit: number (optional, default 50, max 100)
 * - cursor: string (optional, ObjectId as string for cursor-based pagination)
 *
 * Response (200): KarmaHistoryResponse
 * Response (400): Invalid query params or invalid IDs
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createGetHistoryRoute(karmaService: KarmaService): Router {
  const router = Router({ mergeParams: true });

  router.get(
    "/:userId",
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.userId) {
          throw HttpError.badRequest("Missing userId parameter");
        }

        const familyId = validateObjectId(req.params.familyId, "familyId");
        const userId = validateObjectId(req.params.userId, "userId");
        const requestingUserId = validateObjectId(
          req.user.id,
          "requestingUserId",
        );

        // Parse query params
        const limitParam = req.query.limit as string | undefined;
        const cursor = req.query.cursor as string | undefined;

        // Validate cursor if provided
        if (cursor && !isValidObjectId(cursor)) {
          throw HttpError.badRequest("Invalid cursor");
        }

        // Default limit: 50, max: 100
        let limit = 50;
        if (limitParam) {
          const parsedLimit = Number.parseInt(limitParam, 10);
          if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
            throw HttpError.badRequest("Limit must be a positive number");
          }
          if (parsedLimit > 100) {
            throw HttpError.badRequest("Limit cannot exceed 100");
          }
          limit = parsedLimit;
        }

        logger.debug("Fetching karma history via API", {
          familyId,
          userId,
          requestingUserId,
          limit,
          cursor,
        });

        const history = await karmaService.getKarmaHistory(
          familyId,
          userId,
          requestingUserId,
          limit,
          cursor,
        );

        res.status(200).json(history);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
