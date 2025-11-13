"use client";

import { useEffect, useState } from "react";
import { useActivityEvents } from "@/lib/realtime/use-activity-events";
import { useFamilyEvents } from "@/lib/realtime/use-family-events";
import { useKarmaEvents } from "@/lib/realtime/use-karma-events";
import { useRealtimeConnection } from "@/lib/realtime/use-realtime-connection";
import { useRewardEvents } from "@/lib/realtime/use-reward-events";
import { useTaskEvents } from "@/lib/realtime/use-task-events";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/user.slice";

/**
 * Provider component that manages realtime WebSocket connection
 * and subscribes to all event types.
 *
 * Should be placed high in the component tree, typically in the layout.
 */
export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const user = useAppSelector(selectUser);
  // WORKAROUND: Use direct access instead of selector
  // The selector was returning null even though families[0] exists
  const currentFamily = user?.families?.[0] || null;

  // Get WebSocket URL from environment
  // For HTTPS deployments, WebSocket connections MUST go through Caddy proxy (wss://)
  // For HTTP deployments, can connect directly to API server (ws://)
  const [wsUrl, setWsUrl] = useState<string | null>(null);

  useEffect(() => {
    // WebSocket URL: Use dedicated env var for secure connections through Caddy
    // Fallback to direct API connection only for local HTTP development
    const url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
    setWsUrl(url);
  }, []);

  // Get auth token from user profile
  // The /me endpoint returns websocketToken which we can use for WebSocket auth
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Clear token when user changes to prevent stale token usage
    setToken(null);

    // Fetch websocket token from /me endpoint with retry logic
    // The session cookie is HttpOnly, so we can't read it from JavaScript
    // The /me endpoint extracts it server-side and returns it
    async function fetchToken(retryCount = 0) {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const response = await fetch(`${apiUrl}/v1/auth/me`, {
          credentials: "include", // Include HttpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.websocketToken) {
            setToken(data.websocketToken);
            return;
          }
        }

        // Retry on failure with exponential backoff (max 2 retries)
        if (retryCount < 2) {
          const delay = 2 ** retryCount * 500; // 500ms, 1000ms
          setTimeout(() => fetchToken(retryCount + 1), delay);
        }
      } catch (error) {
        console.error("[Realtime Provider] Error fetching token:", error);
        // Retry on error
        if (retryCount < 2) {
          const delay = 2 ** retryCount * 500;
          setTimeout(() => fetchToken(retryCount + 1), delay);
        }
      }
    }

    // Only fetch if we have a user (meaning we're authenticated)
    if (user) {
      fetchToken();
    }
  }, [user]);

  // Create connection config only when we have all required data
  const connectionConfig =
    wsUrl && token && user
      ? {
          url: wsUrl,
          token,
          autoConnect: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      : null;

  // Initialize realtime connection
  const { socket } = useRealtimeConnection(connectionConfig);

  // Subscribe to event types
  const familyId = currentFamily?.familyId ?? null;
  const eventsEnabled = !!socket && !!familyId && !!user;
  const activityEventsEnabled = !!socket && !!user;

  useTaskEvents(socket, familyId, user?.id ?? null, eventsEnabled);
  useKarmaEvents(socket, familyId, user?.id ?? null, eventsEnabled);
  useRewardEvents(socket, familyId, user?.id ?? null, eventsEnabled);
  useFamilyEvents(socket, familyId, user?.id ?? null, eventsEnabled);
  useActivityEvents(socket, user?.id ?? null, activityEventsEnabled);

  return <>{children}</>;
}
