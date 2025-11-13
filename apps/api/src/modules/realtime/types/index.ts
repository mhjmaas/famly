import type { Server, Socket } from "socket.io";

/**
 * Authenticated socket with userId in socket.data
 */
export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
  };
}

/**
 * Socket.IO server instance type
 */
export type SocketIOServer = Server;

/**
 * Event payload for broadcasting to user rooms
 */
export interface UserRoomEvent<T = unknown> {
  event: string;
  payload: T;
  targetUserIds: string[];
}
