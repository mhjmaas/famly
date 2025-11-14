import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toDiaryEntryDTO } from "../../lib/diary-entry.mapper";
import { DiaryRepository } from "../../repositories/diary.repository";
import { DiaryService } from "../../services/diary.service";
import { validateUpdateEntry } from "../../validators/update-entry.validator";

/**
 * PATCH /:familyId/diary/:entryId - Update a family diary entry
 *
 * Requires authentication and family membership
 *
 * Request body:
 * - date?: string (format: YYYY-MM-DD)
 * - entry?: string (1-10,000 characters)
 *
 * Response (200): DiaryEntryDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Entry not found
 */
export function createFamilyDiaryUpdateEntryRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const diaryRepository = new DiaryRepository();
  const diaryService = new DiaryService(diaryRepository);

  router.patch(
    "/:entryId",
    authenticate,
    authorizeFamilyRole({
      allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
    }),
    validateUpdateEntry,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }
        if (!req.params.entryId) {
          throw HttpError.badRequest("Missing entryId parameter");
        }

        const updatedEntry = await diaryService.updateFamilyEntry(
          req.params.familyId,
          req.params.entryId,
          req.body,
        );

        res.json(toDiaryEntryDTO(updatedEntry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
