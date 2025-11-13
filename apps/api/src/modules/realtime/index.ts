// Server exports

// Event emitter exports
export { emitToRoom, emitToUserRooms } from "./events/event-emitter";
// Room manager exports
export {
  getChatRoomName,
  getUserRoomName,
  joinRoom,
  leaveRoom,
} from "./rooms/room-manager";
export { authenticateSocket } from "./server/auth.middleware";
export type { ModuleConnectionHandler } from "./server/connection-handler";
export {
  handleConnections,
  registerModuleHandler,
} from "./server/connection-handler";
export {
  createSocketServer,
  getSocketIOServer,
  setSocketIOServer,
} from "./server/socket-server";

// Type exports
export type {
  AuthenticatedSocket,
  SocketIOServer,
  UserRoomEvent,
} from "./types";
