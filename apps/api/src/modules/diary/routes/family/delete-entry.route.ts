import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { DiaryRepository } from "../../repositories/diary.repository";
import { DiaryService } from "../../services/diary.service";

/**
 * DELETE /:familyId/diary/:entryId - Delete a family diary entry
 *
 * Requires authentication and family membership
 *
 * Response (204): No Content
 * Response (401): Authentication required
 * Response (403): Not a family member
 * Response (404): Entry not found
 */
export function createFamilyDiaryDeleteEntryRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const diaryRepository = new DiaryRepository();
  const diaryService = new DiaryService(diaryRepository);

  router.delete(
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

        await diaryService.deleteFamilyEntry(
          req.params.familyId,
          req.params.entryId,
        );

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
