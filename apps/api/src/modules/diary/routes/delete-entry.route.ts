import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeCreatorOwnership } from "@modules/auth/middleware/authorize-creator-ownership";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { DiaryRepository } from "../repositories/diary.repository";

/**
 * DELETE /:entryId - Delete a diary entry
 *
 * Requires authentication and creator ownership
 *
 * Response (204): No content on success
 * Response (401): Authentication required
 * Response (403): Not the creator of this entry
 * Response (404): Entry not found
 */
export function deleteEntryRoute(): Router {
  const router = Router();
  const diaryRepository = new DiaryRepository();

  router.delete(
    "/:entryId",
    authenticate,
    authorizeCreatorOwnership({
      resourceIdParam: "entryId",
      lookupFn: (id: ObjectId) => diaryRepository.findById(id),
    }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.params.entryId) {
          throw HttpError.badRequest("Missing entryId parameter");
        }

        let entryId: ObjectId;
        try {
          entryId = new ObjectId(req.params.entryId);
        } catch {
          throw HttpError.notFound("Entry not found");
        }

        const deleted = await diaryRepository.deleteEntry(entryId);

        if (!deleted) {
          throw HttpError.notFound("Entry not found");
        }

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
