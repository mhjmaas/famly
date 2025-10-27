import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import type { KarmaService } from "../services/karma.service";
import { validateGrantKarma } from "../validators/grant-karma.validator";

/**
 * Grant karma route
 *
 * POST /v1/families/:familyId/karma/grant
 *
 * Manually grants karma to a family member (parent-only operation)
 *
 * Request body:
 * - userId: string (ObjectId)
 * - amount: number (1-1000)
 * - description: string (optional, max 500 chars)
 *
 * Response (201): Created event with new total
 * Response (400): Validation error or recipient not a family member
 * Response (401): Authentication required
 * Response (403): Not a parent or not a family member
 */
export function createGrantKarmaRoute(karmaService: KarmaService): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/",
    validateGrantKarma,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid family ID");
        }

        if (!ObjectId.isValid(req.body.userId)) {
          throw HttpError.badRequest("Invalid user ID");
        }

        const familyId = new ObjectId(req.params.familyId);
        const grantedBy = new ObjectId(req.user.id);
        const recipientUserId = new ObjectId(req.body.userId);

        logger.info("Granting karma via API", {
          familyId: familyId.toString(),
          recipientUserId: recipientUserId.toString(),
          grantedBy: grantedBy.toString(),
          amount: req.body.amount,
        });

        // Grant karma (service validates parent role)
        const karmaEvent = await karmaService.grantKarma(
          familyId,
          recipientUserId,
          req.body.amount,
          req.body.description,
          grantedBy,
        );

        // Fetch updated member karma to get new total
        const memberKarma = await karmaService.getMemberKarma(
          familyId,
          recipientUserId,
          grantedBy,
        );

        res.status(201).json({
          eventId: karmaEvent._id.toString(),
          familyId: karmaEvent.familyId.toString(),
          userId: karmaEvent.userId.toString(),
          amount: karmaEvent.amount,
          totalKarma: memberKarma.totalKarma,
          description: karmaEvent.description,
          grantedBy: grantedBy.toString(),
          createdAt: karmaEvent.createdAt.toISOString(),
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
