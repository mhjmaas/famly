import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeCreatorOwnership } from "@modules/auth/middleware/authorize-creator-ownership";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";
import { validateUpdateEntry } from "../validators/update-entry.validator";

/**
 * PATCH /:entryId - Update a diary entry
 *
 * Requires authentication and creator ownership
 *
 * Request body:
 * - date?: string (optional, format: YYYY-MM-DD)
 * - entry?: string (optional, max 10,000 characters)
 *
 * Response (200): DiaryEntryDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not the creator of this entry
 * Response (404): Entry not found
 */
export function updateEntryRoute(): Router {
  const router = Router();
  const diaryRepository = new DiaryRepository();

  router.patch(
    "/:entryId",
    authenticate,
    authorizeCreatorOwnership({
      resourceIdParam: "entryId",
      lookupFn: (id: ObjectId) => diaryRepository.findById(id),
    }),
    validateUpdateEntry,
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

        const entry = await diaryRepository.updateEntry(entryId, req.body);

        if (!entry) {
          throw HttpError.notFound("Entry not found");
        }

        res.status(200).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
