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

        res.status(201).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
