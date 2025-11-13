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

  // Create connection config only when we have all required data
  const connectionConfig =
    wsUrl && user
      ? {
          url: wsUrl,
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
