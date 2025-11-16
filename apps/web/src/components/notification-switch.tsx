"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { requestNotificationPermission } from "@/lib/pwa/notifications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsSubscribed,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "@/store/slices/notifications.slice";

export function NotificationSwitch() {
  const dispatch = useAppDispatch();
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (checked: boolean) => {
    setIsLoading(true);
    try {
      if (checked) {
        // Clear dismissal when user enables notifications
        // This allows them to immediately re-enable if they change their mind
        localStorage.removeItem("pwa-notification-dismissed");

        // Subscribe to notifications
        const permission = await requestNotificationPermission();

        if (permission === "granted") {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            await dispatch(subscribeToNotifications(vapidKey));
          }
        }
      } else {
        // Unsubscribe from notifications
        await dispatch(unsubscribeFromNotifications());
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Switch
      checked={isSubscribed}
      onCheckedChange={handleChange}
      disabled={isLoading}
      data-testid="notification-switch"
    />
  );
}
