import { Router } from "express";
import { listEventsRoute } from "./list-events.route";

/**
 * Activity Events router
 * Handles all activity event-related endpoints
 */
export function activityEventsRouter(): Router {
  const router = Router();

  // GET /activity-events - List activity events for authenticated user
  router.use("/", listEventsRoute());

  return router;
}
