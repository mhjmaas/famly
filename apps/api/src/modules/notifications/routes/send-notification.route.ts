import type { Request, Response } from "express";
import { HttpError } from "../../../lib/http-error";
import { NotificationService } from "../services/notification.service";
import { sendNotificationSchema } from "../validators/send-notification.validator";

export async function sendNotificationRoute(req: Request, res: Response) {
  const service = new NotificationService();

  if (!service.isVapidConfigured()) {
    throw new HttpError({
      statusCode: 503,
      message: "Push notifications not configured",
      error: "SERVICE_UNAVAILABLE",
    });
  }

  const result = sendNotificationSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpError.badRequest(
      "Invalid notification data",
      result.error.issues,
    );
  }

  const { userId, notification } = result.data;

  const stats = await service.sendNotification(userId, notification);

  res.status(200).json({
    success: true,
    sent: stats.sent,
    failed: stats.failed,
  });
}
