import type { Server as HTTPServer } from "node:http";
import { logger } from "@lib/logger";
import { Server } from "socket.io";
import type { SocketIOServer } from "../types";

// Global reference to Socket.IO server instance
let ioInstance: SocketIOServer | null = null;

/**
 * Create and configure Socket.IO server
 * This is the centralized Socket.IO server used by all modules
 *
 * @param httpServer HTTP server instance to attach Socket.IO to
 * @param authMiddleware Authentication middleware function
 * @param connectionHandler Handler for new connections
 * @returns Configured Socket.IO server instance
 */
export function createSocketServer(
  httpServer: HTTPServer,
  authMiddleware: (socket: any, next: (error?: Error) => void) => Promise<void>,
  connectionHandler: (io: SocketIOServer) => void,
): SocketIOServer {
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
  io.use(authMiddleware);

  // Store the Socket.IO server instance globally
  ioInstance = io;

  // Register the connection handler
  connectionHandler(io);

  logger.info("Socket.IO server created successfully");
  return io;
}

/**
 * Get the global Socket.IO server instance
 * Used by event emitters to broadcast events
 *
 * @returns Socket.IO server instance or null if not initialized
 */
export function getSocketIOServer(): SocketIOServer | null {
  return ioInstance;
}

/**
 * Set the global Socket.IO server instance
 * Alternative to createSocketServer for testing or custom setup
 *
 * @param io Socket.IO server instance
 */
export function setSocketIOServer(io: SocketIOServer): void {
  ioInstance = io;
  logger.info("Socket.IO server instance registered");
}
