import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toDiaryEntryDTO } from "../../lib/diary-entry.mapper";
import { DiaryRepository } from "../../repositories/diary.repository";
import { DiaryService } from "../../services/diary.service";
import { validateCreateEntry } from "../../validators/create-entry.validator";

/**
 * POST /:familyId/diary - Create a new family diary entry
 *
 * Requires authentication and family membership
 *
 * Request body:
 * - date: string (required, format: YYYY-MM-DD)
 * - entry: string (required, 1-10,000 characters)
 *
 * Response (201): DiaryEntryDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createFamilyDiaryCreateEntryRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const diaryRepository = new DiaryRepository();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );
  const diaryService = new DiaryService(diaryRepository, activityEventService);

  router.post(
    "/",
    authenticate,
    authorizeFamilyRole({
      allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
    }),
    validateCreateEntry,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const entry = await diaryService.createFamilyEntry(
          req.params.familyId,
          req.user.id,
          req.body,
        );

        res.status(201).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
