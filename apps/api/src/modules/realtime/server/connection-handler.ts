import { logger } from "@lib/logger";
import type { Server as SocketIOServer } from "socket.io";

/**
 * Type for module-specific connection handlers
 * Each module can register its own handler to set up event listeners
 */
export type ModuleConnectionHandler = (io: SocketIOServer) => void;

// Store registered module handlers
const moduleHandlers: ModuleConnectionHandler[] = [];

/**
 * Register a module-specific connection handler
 * This allows modules to register their own Socket.IO event handlers
 *
 * @param handler Module connection handler function
 */
export function registerModuleHandler(handler: ModuleConnectionHandler): void {
  moduleHandlers.push(handler);
  logger.debug(`Registered module connection handler`);
}

/**
 * Main connection handler that delegates to all registered module handlers
 * This should be passed to createSocketServer
 *
 * @param io Socket.IO server instance
 */
export function handleConnections(io: SocketIOServer): void {
  // Call all registered module handlers
  for (const handler of moduleHandlers) {
    handler(io);
  }

  logger.info(
    `Connection handler initialized with ${moduleHandlers.length} module handlers`,
  );
}
