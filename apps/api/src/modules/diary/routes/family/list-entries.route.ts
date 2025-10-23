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

/**
 * GET /:familyId/diary - List all family diary entries
 *
 * Requires authentication and family membership
 *
 * Query parameters:
 * - startDate?: string (format: YYYY-MM-DD)
 * - endDate?: string (format: YYYY-MM-DD)
 *
 * Response (200): DiaryEntryDTO[]
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createFamilyDiaryListEntriesRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const diaryRepository = new DiaryRepository();

  router.get(
    "/",
    authenticate,
    authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent, FamilyRole.Child] }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        // Validate ObjectId formats
        if (!ObjectId.isValid(req.params.familyId)) {
          throw HttpError.badRequest("Invalid family ID format");
        }

        const familyId = new ObjectId(req.params.familyId);
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const entries = await diaryRepository.findFamilyEntriesInDateRange(
          familyId,
          startDate,
          endDate,
        );

        res.json(entries.map(toDiaryEntryDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
