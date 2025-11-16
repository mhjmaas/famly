import { Router } from "express";
import { authenticate } from "../../auth/middleware/authenticate";
import { sendNotificationRoute } from "./send-notification.route";
import { subscribeRoute } from "./subscribe.route";
import { unsubscribeRoute } from "./unsubscribe.route";

export function createNotificationsRouter(): Router {
  const router = Router();

  // User-facing endpoints (require authentication)
  router.post("/subscribe", authenticate, subscribeRoute);
  router.delete("/unsubscribe", authenticate, unsubscribeRoute);

  // Internal endpoint for sending notifications
  // Note: In production, this should be restricted to internal services only
  router.post("/send", sendNotificationRoute);

  return router;
}
