/**
 * Send Notification to Family Members
 * Helper utility to send notifications to all family members except the sender
 */

import { logger } from "../../../lib/logger";
import { NotificationService } from "../services/notification.service";
import type { NotificationPayload } from "./notification-templates";

/**
 * Send a notification to all family members except the sender
 * @param familyMemberIds - Array of family member user IDs
 * @param excludeUserId - User ID to exclude (usually the person who triggered the event)
 * @param notification - The notification payload to send
 */
export async function sendToFamilyMembers(
  familyMemberIds: string[],
  excludeUserId: string,
  notification: NotificationPayload,
): Promise<void> {
  const notificationService = new NotificationService();

  // Check if notifications are configured
  if (!notificationService.isVapidConfigured()) {
    logger.warn("VAPID not configured, skipping notification send");
    return;
  }

  // Filter out the user who triggered the event
  const recipientIds = familyMemberIds.filter((id) => id !== excludeUserId);

  if (recipientIds.length === 0) {
    logger.debug("No recipients for notification");
    return;
  }

  // Send notifications to each recipient
  const results = await Promise.allSettled(
    recipientIds.map((userId) =>
      notificationService.sendNotification(userId, notification),
    ),
  );

  // Log results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  logger.info("Sent family notifications", {
    successful,
    failed,
    total: recipientIds.length,
    notificationType: notification.data?.type,
  });

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.error("Failed to send notification to family member", {
        userId: recipientIds[index],
        error: result.reason,
      });
    }
  });
}
