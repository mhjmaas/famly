import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";

/**
 * GET / - List all diary entries for the authenticated user
 *
 * Requires authentication
 *
 * Query parameters (optional):
 * - startDate: string (format: YYYY-MM-DD) - filter entries from this date
 * - endDate: string (format: YYYY-MM-DD) - filter entries until this date
 *
 * Response (200): Array of DiaryEntryDTO
 * Response (401): Authentication required
 */
export function listEntriesRoute(): Router {
  const router = Router();
  const diaryRepository = new DiaryRepository();

  router.get(
    "/",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const entries = await diaryRepository.findByCreatorInDateRange(
          userId,
          startDate,
          endDate,
        );

        res.status(200).json(entries.map(toDiaryEntryDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
