"use client";

import { useEffect } from "react";
import {
  captureInstallPrompt,
  isAppInstalled,
  isMobileDevice,
} from "@/lib/pwa/install";
import {
  checkNotificationSupport,
  getNotificationPermissionStatus,
} from "@/lib/pwa/notifications";
import { registerServiceWorker } from "@/lib/pwa/service-worker";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  checkSubscriptionStatus,
  selectIsSubscribed,
  selectPermissionStatus,
  selectShowInstallDrawer,
  selectShowPermissionDrawer,
  setCanInstall,
  setPermissionStatus,
  showInstallDrawerAction,
  showPermissionDrawerAction,
} from "@/store/slices/notifications.slice";

const PERMISSION_DISMISSAL_KEY = "pwa-notification-dismissed";
const INSTALL_DISMISSAL_KEY = "pwa-install-dismissed";
const DISMISSAL_DURATION_DAYS = 7; // Don't re-prompt for 7 days

function wasDismissedRecently(key: string): boolean {
  if (typeof window === "undefined") return false;

  const dismissed = localStorage.getItem(key);
  if (!dismissed) return false;

  const dismissedDate = new Date(dismissed);
  const daysSinceDismissal =
    (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceDismissal < DISMISSAL_DURATION_DAYS;
}

export function PWAProvider() {
  const dispatch = useAppDispatch();
  const permissionStatus = useAppSelector(selectPermissionStatus);
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const showPermissionDrawer = useAppSelector(selectShowPermissionDrawer);
  const showInstallDrawer = useAppSelector(selectShowInstallDrawer);

  // Initialize PWA features
  useEffect(() => {
    // Register service worker
    if (checkNotificationSupport()) {
      registerServiceWorker().catch((error) => {
        console.error("Failed to register service worker:", error);
      });
    }

    // Capture install prompt event
    captureInstallPrompt();

    // Listen for app installable event
    const handleAppInstallable = () => {
      dispatch(setCanInstall(true));
    };

    window.addEventListener("appinstallable", handleAppInstallable);

    return () => {
      window.removeEventListener("appinstallable", handleAppInstallable);
    };
  }, [dispatch]);

  // Check notification permission status
  useEffect(() => {
    if (!checkNotificationSupport()) return;

    const currentStatus = getNotificationPermissionStatus();
    dispatch(setPermissionStatus(currentStatus));

    // Check current subscription status
    dispatch(checkSubscriptionStatus());
  }, [dispatch]);

  // Show notification subscription drawer if user is not yet subscribed
  useEffect(() => {
    if (!checkNotificationSupport()) return;
    if (showPermissionDrawer) return; // Already showing
    if (isSubscribed) return; // Already subscribed
    if (wasDismissedRecently(PERMISSION_DISMISSAL_KEY)) return;

    // Show notification drawer after a short delay to avoid overwhelming user
    const timer = setTimeout(() => {
      dispatch(showPermissionDrawerAction());
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, [dispatch, isSubscribed, showPermissionDrawer]);

  // Show install drawer after permission is granted (mobile only)
  useEffect(() => {
    if (showInstallDrawer) return; // Already showing
    if (!isMobileDevice()) return; // Only show on mobile devices
    if (permissionStatus !== "granted") return; // Wait for permission first
    if (isAppInstalled()) return; // Already installed
    if (wasDismissedRecently(INSTALL_DISMISSAL_KEY)) return;

    // Show install drawer after permission is granted
    const timer = setTimeout(() => {
      dispatch(showInstallDrawerAction());
    }, 2000); // 2 second delay after permission

    return () => clearTimeout(timer);
  }, [dispatch, permissionStatus, showInstallDrawer]);

  // This component doesn't render anything
  return null;
}
