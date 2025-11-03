import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
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
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );

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

        // Record activity event for diary entry creation
        try {
          await activityEventService.recordEvent({
            userId,
            type: "DIARY",
            title: `Diary entry for ${req.body.date}`,
            description: req.body.entry.substring(0, 100), // First 100 chars as preview
          });
        } catch (error) {
          logger.error("Failed to record activity event for diary entry", {
            userId: userId.toString(),
            error,
          });
        }

        res.status(201).json(toDiaryEntryDTO(entry));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
