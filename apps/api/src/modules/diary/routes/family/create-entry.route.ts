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
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../../lib/diary-entry.mapper";
import { DiaryRepository } from "../../repositories/diary.repository";
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

        // Validate ObjectId formats
        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid family ID format");
        }

        const userId = new ObjectId(req.user.id);
        const familyId = new ObjectId(req.params.familyId);

        const entry = await diaryRepository.createFamilyEntry(
          userId,
          familyId,
          req.body,
        );

        // Record activity event for family diary entry creation
        try {
          await activityEventService.recordEvent({
            userId,
            type: "FAMILY_DIARY",
            title: `Family diary entry for ${req.body.date}`,
            description: req.body.entry.substring(0, 100), // First 100 chars as preview
          });
        } catch (error) {
          logger.error(
            "Failed to record activity event for family diary entry",
            {
              userId: userId.toString(),
              error,
            },
          );
        }

        res.status(201).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
