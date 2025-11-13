"use client";

import { Loader2, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConnectionState, type ConnectionStatus } from "@/lib/realtime/types";

interface RealtimeStatusProps {
  status: ConnectionStatus;
  className?: string;
}

/**
 * Badge showing realtime connection status
 * Displays online/offline/connecting state with icon
 */
export function RealtimeStatus({ status, className }: RealtimeStatusProps) {
  switch (status.state) {
    case ConnectionState.CONNECTED:
      return (
        <Badge
          variant="outline"
          className={`bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400 ${className}`}
        >
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </Badge>
      );

    case ConnectionState.CONNECTING:
    case ConnectionState.RECONNECTING:
      return (
        <Badge
          variant="outline"
          className={`bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400 ${className}`}
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          {status.state === ConnectionState.RECONNECTING
            ? "Reconnecting..."
            : "Connecting..."}
        </Badge>
      );

    case ConnectionState.ERROR:
      return (
        <Badge
          variant="outline"
          className={`bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400 ${className}`}
          title={status.error}
        >
          <WifiOff className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className={`bg-gray-500/10 text-gray-700 border-gray-500/20 dark:text-gray-400 ${className}`}
        >
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </Badge>
      );
  }
}
