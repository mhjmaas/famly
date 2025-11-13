"use client";

import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { ConnectionState, type ConnectionStatus } from "./types";

/**
 * Configuration for realtime connection
 */
export interface RealtimeConnectionConfig {
  url: string;
  token: string;
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

/**
 * Hook for managing Socket.IO realtime connection
 * Handles connection lifecycle, authentication, and reconnection
 *
 * @param config Connection configuration
 * @returns Socket instance and connection status
 */
export function useRealtimeConnection(
  config: RealtimeConnectionConfig | null,
): {
  socket: Socket | null;
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
} {
  const [status, setStatus] = useState<ConnectionStatus>({
    state: ConnectionState.DISCONNECTED,
  });

  // Use state instead of ref so that updates trigger re-renders in dependent hooks
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const hasConfig = Boolean(config);
  const url = config?.url;
  const token = config?.token;
  const autoConnect = config?.autoConnect ?? true;
  const reconnectionAttempts = config?.reconnectionAttempts ?? 5;
  const reconnectionDelay = config?.reconnectionDelay ?? 1000;

  // Initialize socket connection
  useEffect(() => {
    if (!hasConfig || autoConnect === false) {
      return;
    }

    // Don't create a new socket if one already exists
    if (socketRef.current?.connected) {
      return;
    }

    if (!url || !token) {
      return;
    }

    // Create socket instance
    const newSocket = io(url, {
      auth: {
        token,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts,
      reconnectionDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect,
    });

    socketRef.current = newSocket;
    setSocket(newSocket); // Update state to trigger re-render

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("[Realtime] Connected to Socket.IO server");
      setStatus({ state: ConnectionState.CONNECTED });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Realtime] Disconnected:", reason);
      setStatus({ state: ConnectionState.DISCONNECTED });
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Realtime] Connection error:", error.message);
      setStatus({
        state: ConnectionState.ERROR,
        error: error.message,
      });
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[Realtime] Reconnection attempt ${attemptNumber}`);
      setStatus({ state: ConnectionState.RECONNECTING });
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`[Realtime] Reconnected after ${attemptNumber} attempts`);
      setStatus({ state: ConnectionState.CONNECTED });
    });

    newSocket.on("reconnect_failed", () => {
      console.error("[Realtime] Reconnection failed");
      setStatus({
        state: ConnectionState.ERROR,
        error: "Failed to reconnect after maximum attempts",
      });
    });

    // Set initial state
    if (newSocket.connected) {
      setStatus({ state: ConnectionState.CONNECTED });
    } else {
      setStatus({ state: ConnectionState.CONNECTING });
    }

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.removeAllListeners();
        newSocket.disconnect();
      }
      setSocket(null); // Clear state on cleanup
    };
  }, [
    hasConfig,
    url,
    token,
    autoConnect,
    reconnectionAttempts,
    reconnectionDelay,
  ]);

  // Manual connect function
  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
      setStatus({ state: ConnectionState.CONNECTING });
    }
  };

  // Manual disconnect function
  const disconnect = () => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
      setStatus({ state: ConnectionState.DISCONNECTED });
    }
  };

  return {
    socket, // Return state instead of ref so updates trigger re-renders
    status,
    connect,
    disconnect,
  };
}
