import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeCreatorOwnership } from "@modules/auth/middleware/authorize-creator-ownership";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";

/**
 * GET /:entryId - Get a specific diary entry
 *
 * Requires authentication and creator ownership
 *
 * Response (200): DiaryEntryDTO
 * Response (401): Authentication required
 * Response (403): Not the creator of this entry
 * Response (404): Entry not found
 */
export function getEntryRoute(): Router {
  const router = Router();
  const diaryRepository = new DiaryRepository();

  router.get(
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

        const entry = await diaryRepository.findById(entryId);

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
