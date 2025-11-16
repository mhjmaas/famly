"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission } from "@/lib/pwa/notifications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsSubscribed,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "@/store/slices/notifications.slice";

interface NotificationToggleProps {
  ariaLabel?: string;
}

export function NotificationToggle({
  ariaLabel = "Toggle notifications",
}: NotificationToggleProps) {
  const dispatch = useAppDispatch();
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        // Unsubscribe from notifications
        await dispatch(unsubscribeFromNotifications());
      } else {
        // Subscribe to notifications
        // First request permission if needed
        const permission = await requestNotificationPermission();

        if (permission === "granted") {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
          if (vapidKey) {
            await dispatch(subscribeToNotifications(vapidKey));
          }
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      aria-label={ariaLabel}
      title={isSubscribed ? "Notifications enabled" : "Notifications disabled"}
      data-testid="notification-toggle"
    >
      {isLoading ? (
        <Loader2
          className="h-5 w-5 animate-spin"
          data-testid="notification-toggle-loading"
        />
      ) : isSubscribed ? (
        <Bell className="h-5 w-5" data-testid="notification-toggle-on" />
      ) : (
        <BellOff
          className="h-5 w-5 text-muted-foreground"
          data-testid="notification-toggle-off"
        />
      )}
    </Button>
  );
}
