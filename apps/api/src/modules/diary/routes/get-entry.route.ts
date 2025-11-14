import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeCreatorOwnership } from "@modules/auth/middleware/authorize-creator-ownership";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";
import { DiaryService } from "../services/diary.service";

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
  const diaryService = new DiaryService(diaryRepository);

  router.get(
    "/:entryId",
    authenticate,
    authorizeCreatorOwnership({
      resourceIdParam: "entryId",
      lookupFn: (id: string) => diaryService.findEntryById(id),
    }),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }
        if (!req.params.entryId) {
          throw HttpError.badRequest("Missing entryId parameter");
        }

        const entry = await diaryService.getPersonalEntry(
          req.params.entryId,
          req.user.id,
        );

        res.status(200).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
