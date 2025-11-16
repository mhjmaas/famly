import type { Response } from "express";
import { HttpError } from "../../../lib/http-error";
import type { AuthenticatedRequest } from "../../auth/middleware/authenticate";
import { NotificationService } from "../services/notification.service";
import { subscribeSchema } from "../validators/subscribe.validator";

export async function subscribeRoute(req: AuthenticatedRequest, res: Response) {
  const service = new NotificationService();

  if (!service.isVapidConfigured()) {
    throw new HttpError({
      statusCode: 503,
      message: "Push notifications not configured",
      error: "SERVICE_UNAVAILABLE",
    });
  }

  const userId = req.user?.id;
  if (!userId) {
    throw HttpError.unauthorized();
  }

  const result = subscribeSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpError.badRequest(
      "Invalid subscription data",
      result.error.issues,
    );
  }

  const { endpoint, keys, deviceInfo } = result.data;

  await service.subscribe(userId, endpoint, keys, deviceInfo || {});

  res.status(200).json({ success: true });
}
