import { HttpError } from "@lib/http-error";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toDiaryEntryDTO } from "../lib/diary-entry.mapper";
import { DiaryRepository } from "../repositories/diary.repository";
import { DiaryService } from "../services/diary.service";
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
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );
  const diaryService = new DiaryService(diaryRepository, activityEventService);

  router.post(
    "/",
    authenticate,
    validateCreateEntry,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const entry = await diaryService.createPersonalEntry(
          req.user.id,
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
