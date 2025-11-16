import { Router } from "express";
import { authenticate } from "../../auth/middleware/authenticate";
import { subscribeRoute } from "./subscribe.route";
import { unsubscribeRoute } from "./unsubscribe.route";

export function createNotificationsRouter(): Router {
  const router = Router();

  // User-facing endpoints (require authentication)
  router.post("/subscribe", authenticate, subscribeRoute);
  router.delete("/unsubscribe", authenticate, unsubscribeRoute);

  // Send notification endpoint (requires authentication)
  // Note: This endpoint is currently unused - notifications are sent server-side via sendToUser()
  // router.post("/send", authenticate, sendNotificationRoute);

  return router;
}
