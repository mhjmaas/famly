import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../../lib/diary-entry.mapper";
import { DiaryRepository } from "../../repositories/diary.repository";
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

        // Validate ObjectId formats
        if (!ObjectId.isValid(req.params.entryId)) {
          throw HttpError.badRequest("Invalid entry ID format");
        }
        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid family ID format");
        }

        const entryId = new ObjectId(req.params.entryId);
        const familyId = new ObjectId(req.params.familyId);

        const entry = await diaryRepository.findById(entryId);

        if (!entry) {
          throw HttpError.notFound("Diary entry not found");
        }

        // Verify that the entry belongs to this family
        if (!entry.familyId || !entry.familyId.equals(familyId)) {
          throw HttpError.notFound("Diary entry not found");
        }

        const updatedEntry = await diaryRepository.updateEntry(
          entryId,
          req.body,
        );

        if (!updatedEntry) {
          throw HttpError.notFound("Diary entry not found");
        }

        res.json(toDiaryEntryDTO(updatedEntry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
