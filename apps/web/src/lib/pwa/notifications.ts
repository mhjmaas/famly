/**
 * PWA Notifications Utility
 * Provides helper functions for checking notification support and permissions
 */

export type NotificationPermissionStatus = "default" | "granted" | "denied";

/**
 * Check if the browser supports push notifications
 */
export function checkNotificationSupport(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get the current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermissionStatus {
  if (!("Notification" in window)) {
    return "denied";
  }

  return Notification.permission as NotificationPermissionStatus;
}

/**
 * Request notification permission from the user
 * @returns Promise resolving to the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!("Notification" in window)) {
    throw new Error("Notifications not supported");
  }

  try {
    const permission = await Notification.requestPermission();
    return permission as NotificationPermissionStatus;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    throw error;
  }
}

/**
 * Check if notifications are currently enabled
 */
export function areNotificationsEnabled(): boolean {
  return (
    checkNotificationSupport() &&
    getNotificationPermissionStatus() === "granted"
  );
}
