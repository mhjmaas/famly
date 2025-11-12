import type { Server as HTTPServer } from "node:http";
import { logger } from "@lib/logger";
import { Server } from "socket.io";
import { setSocketIOServer } from "./events/chat-events";
import { authenticateSocket } from "./middleware/auth.middleware";
import { registerConnectionHandler } from "./register-handlers";

/**
 * Create and configure Socket.IO server
 * @param httpServer HTTP server instance to attach Socket.IO to
 * @returns Configured Socket.IO server instance
 */
export function createSocketServer(httpServer: HTTPServer): Server {
  // Allow both HTTP and HTTPS origins for Socket.IO connections
  const allowedOrigins = [
    process.env.CORS_ORIGIN || "http://localhost:3000",
    "http://localhost:3000", // HTTP fallback
    "https://localhost:3000", // HTTPS direct access
    "https://localhost:8443", // HTTPS via Caddy reverse proxy (dev)
    "https://localhost", // HTTPS via Caddy reverse proxy (prod)
    "http://127.0.0.1:3000",
    "https://127.0.0.1:3000",
    "https://127.0.0.1:8443", // HTTPS via Caddy for 127.0.0.1 (dev)
  ];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
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
