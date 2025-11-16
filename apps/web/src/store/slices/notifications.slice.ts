import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../store";

export type PermissionStatus = "default" | "granted" | "denied";

interface NotificationsState {
  subscription: PushSubscription | null;
  permissionStatus: PermissionStatus;
  isSubscribed: boolean;
  showPermissionDrawer: boolean;
  showInstallDrawer: boolean;
  canInstall: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  subscription: null,
  permissionStatus: "default",
  isSubscribed: false,
  showPermissionDrawer: false,
  showInstallDrawer: false,
  canInstall: false,
  isLoading: false,
  error: null,
};

// Async thunk to check subscription status
export const checkSubscriptionStatus = createAsyncThunk(
  "notifications/checkStatus",
  async (_, { rejectWithValue }) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        return { isSubscribed: false, subscription: null };
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return {
        isSubscribed: subscription !== null,
        subscription: subscription
          ? JSON.parse(JSON.stringify(subscription))
          : null,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to check subscription status",
      );
    }
  },
);

// Async thunk to subscribe to notifications
export const subscribeToNotifications = createAsyncThunk(
  "notifications/subscribe",
  async (vapidPublicKey: string, { rejectWithValue }) => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications not supported");
      }

      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID key
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey as BufferSource,
      });

      // Send subscription to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
              auth: arrayBufferToBase64(subscription.getKey("auth")),
            },
            deviceInfo: {
              userAgent: navigator.userAgent,
              platform: getPlatform(),
            },
          }),
        },
      );

      if (!response.ok) {
        // If backend save failed, clean up the local subscription to stay in sync
        await subscription.unsubscribe();
        throw new Error("Failed to save subscription to server");
      }

      return JSON.parse(JSON.stringify(subscription));
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to subscribe to notifications",
      );
    }
  },
);

// Async thunk to unsubscribe from notifications
export const unsubscribeFromNotifications = createAsyncThunk(
  "notifications/unsubscribe",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { subscription } = state.notifications;

      if (!subscription) {
        return;
      }

      if ("serviceWorker" in navigator && "PushManager" in window) {
        const registration = await navigator.serviceWorker.ready;
        const pushSubscription =
          await registration.pushManager.getSubscription();

        if (pushSubscription) {
          await pushSubscription.unsubscribe();
        }
      }

      // Remove subscription from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/notifications/unsubscribe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove subscription from server");
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to unsubscribe from notifications",
      );
    }
  },
);

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setPermissionStatus: (state, action: PayloadAction<PermissionStatus>) => {
      state.permissionStatus = action.payload;
    },
    setSubscription: (
      state,
      action: PayloadAction<PushSubscription | null>,
    ) => {
      state.subscription = action.payload;
      state.isSubscribed = action.payload !== null;
    },
    showPermissionDrawer: (state) => {
      state.showPermissionDrawer = true;
    },
    hidePermissionDrawer: (state) => {
      state.showPermissionDrawer = false;
    },
    showInstallDrawer: (state) => {
      state.showInstallDrawer = true;
    },
    hideInstallDrawer: (state) => {
      state.showInstallDrawer = false;
    },
    setCanInstall: (state, action: PayloadAction<boolean>) => {
      state.canInstall = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check subscription status
      .addCase(checkSubscriptionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSubscribed = action.payload.isSubscribed;
        state.subscription = action.payload.subscription;
      })
      .addCase(checkSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Subscribe
      .addCase(subscribeToNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(subscribeToNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.subscription = action.payload;
        state.isSubscribed = true;
        state.showPermissionDrawer = false;
      })
      .addCase(subscribeToNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Unsubscribe
      .addCase(unsubscribeFromNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(unsubscribeFromNotifications.fulfilled, (state) => {
        state.isLoading = false;
        state.subscription = null;
        state.isSubscribed = false;
      })
      .addCase(unsubscribeFromNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setPermissionStatus,
  setSubscription,
  showPermissionDrawer: showPermissionDrawerAction,
  hidePermissionDrawer: hidePermissionDrawerAction,
  showInstallDrawer: showInstallDrawerAction,
  hideInstallDrawer: hideInstallDrawerAction,
  setCanInstall,
  clearError,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

// Selectors
export const selectNotificationSubscription = (state: RootState) =>
  state.notifications.subscription;
export const selectPermissionStatus = (state: RootState) =>
  state.notifications.permissionStatus;
export const selectIsSubscribed = (state: RootState) =>
  state.notifications.isSubscribed;
export const selectShowPermissionDrawer = (state: RootState) =>
  state.notifications.showPermissionDrawer;
export const selectShowInstallDrawer = (state: RootState) =>
  state.notifications.showInstallDrawer;
export const selectCanInstall = (state: RootState) =>
  state.notifications.canInstall;
export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.isLoading;
export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function getPlatform(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(userAgent)) return "ios";
  if (/android/.test(userAgent)) return "android";
  return "desktop";
}
