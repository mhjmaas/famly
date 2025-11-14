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

/**
 * GET /:familyId/diary/:entryId - Get a specific family diary entry
 *
 * Requires authentication and family membership
 *
 * Response (200): DiaryEntryDTO
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Entry not found
 */
export function createFamilyDiaryGetEntryRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const diaryRepository = new DiaryRepository();
  const diaryService = new DiaryService(diaryRepository);

  router.get(
    "/:entryId",
    authenticate,
    authorizeFamilyRole({
      allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
    }),
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

        const entry = await diaryService.getFamilyEntry(
          req.params.familyId,
          req.params.entryId,
        );

        res.json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
