import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";
import { validateCreateEntry } from "../validators/create-entry.validator";

/**
 * POST / - Create a new diary entry
 *
 * Requires authentication
 *
 * Request body:
 * - date: string (required, format: YYYY-MM-DD)
 * - entry: string (required, 1-10,000 characters)
 *
 * Response (201): DiaryEntryDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 */
export function createEntryRoute(): Router {
  const router = Router();
  const diaryRepository = new DiaryRepository();

  router.post(
    "/",
    authenticate,
    validateCreateEntry,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

        const entry = await diaryRepository.createEntry(userId, req.body);

        res.status(201).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
