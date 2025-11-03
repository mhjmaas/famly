import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toActivityEventDTO } from "../lib/activity-event.mapper";
import { ActivityEventRepository } from "../repositories/activity-event.repository";
import { ActivityEventService } from "../services/activity-event.service";
import { validateListEventsQuery } from "../validators/list-events.validator";

/**
 * GET /activity-events - List all activity events for the authenticated user
 *
 * Requires authentication
 *
 * Query parameters (optional):
 * - startDate: string (format: YYYY-MM-DD) - filter events from this date
 * - endDate: string (format: YYYY-MM-DD) - filter events until this date
 *
 * Response (200): Array of ActivityEventDTO (up to 100 events, sorted by most recent first)
 * Response (401): Authentication required
 */
export function listEventsRoute(): Router {
  const router = Router();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );

  router.get(
    "/",
    authenticate,
    validateListEventsQuery,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const events = await activityEventService.getEventsForUser(
          userId,
          startDate,
          endDate,
        );

        res.status(200).json(events.map(toActivityEventDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
