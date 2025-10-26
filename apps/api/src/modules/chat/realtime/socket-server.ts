import type { Server as HTTPServer } from "node:http";
import { Server } from "socket.io";
import { logger } from "@lib/logger";
import { authenticateSocket } from "./middleware/auth.middleware";
import { registerConnectionHandler } from "./register-handlers";
import { setSocketIOServer } from "./events/chat-events";

/**
 * Create and configure Socket.IO server
 * @param httpServer HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export function createSocketServer(httpServer: HTTPServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Connection middleware for authentication
  io.use(authenticateSocket);

  // Register the Socket.IO server instance globally for chat events
  setSocketIOServer(io);

  // Register event handlers for all connections
  registerConnectionHandler(io);

  logger.info("Socket.IO server created successfully");
  return io;
}
