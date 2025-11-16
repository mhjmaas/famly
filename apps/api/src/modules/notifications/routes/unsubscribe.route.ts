import type { Response } from "express";
import { HttpError } from "../../../lib/http-error";
import type { AuthenticatedRequest } from "../../auth/middleware/authenticate";
import { NotificationService } from "../services/notification.service";
import { unsubscribeSchema } from "../validators/unsubscribe.validator";

export async function unsubscribeRoute(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.user?.id;
  if (!userId) {
    throw HttpError.unauthorized();
  }

  const result = unsubscribeSchema.safeParse(req.body);
  if (!result.success) {
    throw HttpError.badRequest("Invalid request data", result.error.issues);
  }

  const { endpoint } = result.data;
  const service = new NotificationService();

  const deleted = await service.unsubscribe(endpoint);

  res.status(200).json({ success: true, deleted });
}
