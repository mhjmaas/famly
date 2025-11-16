"use client";

import { Bell, CheckCircle2, Loader2, MessageSquare, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { requestNotificationPermission } from "@/lib/pwa/notifications";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hidePermissionDrawerAction,
  selectShowPermissionDrawer,
  subscribeToNotifications,
} from "@/store/slices/notifications.slice";

interface NotificationPermissionDrawerProps {
  dictionary: {
    title: string;
    description: string;
    benefits: {
      updates: string;
      instant: string;
      events: string;
    };
    allow: string;
    notNow: string;
  };
}

export function NotificationPermissionDrawer({
  dictionary,
}: NotificationPermissionDrawerProps) {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectShowPermissionDrawer);
  const [isLoading, setIsLoading] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    // Check initial screen size
    setIsLargeScreen(window.matchMedia("(min-width: 1024px)").matches);

    // Listen for changes
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsLargeScreen(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleAllow = async () => {
    setIsLoading(true);
    try {
      // Check if VAPID key is configured
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey || vapidKey === "your_public_key_here") {
        const errorMsg =
          "Push notifications are not configured. VAPID keys are missing.";
        console.error("VAPID Configuration Error:", errorMsg);
        return;
      }

      // Request permission if not already granted
      const permission = await requestNotificationPermission();

      // If permission was granted, subscribe to notifications
      if (permission === "granted") {
        const result = await dispatch(subscribeToNotifications(vapidKey));

        // Check if the subscription was successful
        if (subscribeToNotifications.rejected.match(result)) {
          const errorMsg =
            (result.payload as string) ||
            "Failed to subscribe to notifications";
          console.error("Subscription Error:", errorMsg);
          alert(`Failed to enable notifications: ${errorMsg}`);
        } else {
          console.log("Successfully subscribed to notifications");
        }
      } else {
        console.warn("Notification permission denied or dismissed by user");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Unknown error while enabling notifications";
      console.error("Error enabling notifications:", errorMsg, error);
      alert(`An error occurred while enabling notifications: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    dispatch(hidePermissionDrawerAction());
    // Store dismissal in localStorage to avoid re-prompting too soon
    localStorage.setItem(
      "pwa-notification-dismissed",
      new Date().toISOString(),
    );
  };

  const benefits = (
    <div className="px-4 pb-4" data-testid="pwa-permission-benefits">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {dictionary.benefits.updates}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {dictionary.benefits.instant}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            {dictionary.benefits.events}
          </p>
        </div>
      </div>
    </div>
  );

  const header = (
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
      <Bell className="h-6 w-6 text-primary" />
    </div>
  );

  const buttons = (
    <>
      <Button
        onClick={handleAllow}
        disabled={isLoading}
        data-testid="pwa-permission-allow"
        className="w-full"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {dictionary.allow}
      </Button>
      <Button
        variant="outline"
        onClick={handleDismiss}
        disabled={isLoading}
        data-testid="pwa-permission-dismiss"
        className="w-full"
      >
        {dictionary.notNow}
      </Button>
    </>
  );

  return (
    <>
      {!isLargeScreen && (
        /* Mobile/Tablet Drawer */
        <Drawer open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
          <DrawerContent data-testid="pwa-permission-drawer">
            <DrawerHeader className="text-left">
              {header}
              <DrawerTitle>{dictionary.title}</DrawerTitle>
              <DrawerDescription>{dictionary.description}</DrawerDescription>
            </DrawerHeader>

            {benefits}

            <DrawerFooter className="pt-2">{buttons}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {isLargeScreen && (
        /* Desktop Sheet */
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
          <SheetContent
            data-testid="pwa-permission-sheet"
            className="flex flex-col"
          >
            <SheetHeader className="text-left">
              {header}
              <SheetTitle>{dictionary.title}</SheetTitle>
              <SheetDescription>{dictionary.description}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">{benefits}</div>

            <SheetFooter className="flex-shrink-0">{buttons}</SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
