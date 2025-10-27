import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
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

        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid family ID");
        }

        if (!ObjectId.isValid(req.params.userId)) {
          throw HttpError.badRequest("Invalid user ID");
        }

        const familyId = new ObjectId(req.params.familyId);
        const userId = new ObjectId(req.params.userId);
        const requestingUserId = new ObjectId(req.user.id);

        // Parse query params
        const limitParam = req.query.limit as string | undefined;
        const cursor = req.query.cursor as string | undefined;

        // Validate cursor if provided
        if (cursor && !ObjectId.isValid(cursor)) {
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
          familyId: familyId.toString(),
          userId: userId.toString(),
          requestingUserId: requestingUserId.toString(),
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
