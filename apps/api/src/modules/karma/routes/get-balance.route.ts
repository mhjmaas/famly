import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toMemberKarmaDTO } from "../lib/karma.mapper";
import type { KarmaService } from "../services/karma.service";

/**
 * Get karma balance route
 *
 * GET /v1/families/:familyId/karma/balance/:userId
 *
 * Returns the current karma total for a user in the specified family
 * Any family member can view any other family member's karma balance
 *
 * Response (200): MemberKarmaDTO
 * Response (400): Invalid familyId or userId
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createGetBalanceRoute(karmaService: KarmaService): Router {
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

        logger.debug("Fetching karma balance via API", {
          familyId,
          userId,
          requestingUserId,
        });

        const memberKarma = await karmaService.getMemberKarma(
          familyId,
          userId,
          requestingUserId,
        );

        res.status(200).json(toMemberKarmaDTO(memberKarma));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
