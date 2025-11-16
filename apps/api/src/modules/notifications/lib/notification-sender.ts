/**
 * Notification Sender Utilities
 * Helper functions for sending notifications across different modules
 * Centralizes error handling and logging for all notification sending
 */

import { logger } from "@lib/logger";
import { NotificationService } from "../services/notification.service";
import type { NotificationPayload } from "./notification-templates";

/**
 * Send a notification to a single user
 * @param userId - The user ID to send the notification to
 * @param notification - The notification payload
 * @returns true if successful, false if failed (doesn't throw)
 */
export async function sendToUser(
  userId: string,
  notification: NotificationPayload,
): Promise<boolean> {
  try {
    const notificationService = new NotificationService();

    if (!notificationService.isVapidConfigured()) {
      logger.debug("VAPID not configured, skipping notification");
      return false;
    }

    await notificationService.sendNotification(userId, notification);
    return true;
  } catch (error) {
    logger.debug("Failed to send notification to user", {
      userId,
      notificationType: notification.data?.type,
      error,
    });
    return false;
  }
}

/**
 * Send a notification to multiple users concurrently
 * @param userIds - Array of user IDs to send to
 * @param notification - The notification payload
 * @param options - Optional configuration
 * @returns Object with successful and failed counts
 */
export async function sendToMultipleUsers(
  userIds: string[],
  notification: NotificationPayload,
  options?: {
    excludeUser?: string;
    logContext?: Record<string, unknown>;
  },
): Promise<{ successful: number; failed: number }> {
  const notificationService = new NotificationService();

  if (!notificationService.isVapidConfigured()) {
    logger.debug("VAPID not configured, skipping notifications");
    return { successful: 0, failed: userIds.length };
  }

  // Filter out excluded user if specified
  const recipientIds = options?.excludeUser
    ? userIds.filter((id) => id !== options.excludeUser)
    : userIds;

  if (recipientIds.length === 0) {
    logger.debug("No recipients for notification", options?.logContext);
    return { successful: 0, failed: 0 };
  }

  // Send notifications concurrently
  const results = await Promise.allSettled(
    recipientIds.map((userId) =>
      notificationService.sendNotification(userId, notification),
    ),
  );

  // Count results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Log results
  logger.debug("Sent notifications", {
    successful,
    failed,
    total: recipientIds.length,
    notificationType: notification.data?.type,
    ...options?.logContext,
  });

  // Log failures
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.debug("Failed to send notification", {
        userId: recipientIds[index],
        notificationType: notification.data?.type,
        error: result.reason,
        ...options?.logContext,
      });
    }
  });

  return { successful, failed };
}

/**
 * Send a chat message notification to all members except the sender
 * @param chatMembers - Array of chat member user IDs
 * @param senderId - The user ID who sent the message (excluded from notifications)
 * @param notification - The notification payload
 * @param logContext - Optional logging context
 */
export async function sendChatNotifications(
  chatMembers: string[],
  senderId: string,
  notification: NotificationPayload,
  logContext?: Record<string, unknown>,
): Promise<void> {
  try {
    await sendToMultipleUsers(chatMembers, notification, {
      excludeUser: senderId,
      logContext: {
        context: "chat_notification",
        ...logContext,
      },
    });
  } catch (error) {
    logger.error("Failed to send chat notifications", {
      senderId,
      memberCount: chatMembers.length,
      error,
      ...logContext,
    });
    // Don't re-throw - notification failure shouldn't prevent message creation
  }
}

/**
 * Send a family event notification to all members except the trigger user
 * @param familyMembers - Array of family member user IDs
 * @param triggerId - The user ID who triggered the event (excluded from notifications)
 * @param notification - The notification payload
 * @param logContext - Optional logging context
 */
export async function sendFamilyNotifications(
  familyMembers: string[],
  triggerId: string,
  notification: NotificationPayload,
  logContext?: Record<string, unknown>,
): Promise<void> {
  try {
    await sendToMultipleUsers(familyMembers, notification, {
      excludeUser: triggerId,
      logContext: {
        context: "family_notification",
        ...logContext,
      },
    });
  } catch (error) {
    logger.error("Failed to send family notifications", {
      triggerId,
      memberCount: familyMembers.length,
      error,
      ...logContext,
    });
    // Don't re-throw - notification failure shouldn't prevent family operations
  }
}
