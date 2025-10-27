import { logger } from "@lib/logger";
import type { Server, Socket } from "socket.io";
import { handleMessageSend } from "./handlers/message.handler";
import { handlePresencePing } from "./handlers/presence.handler";
import { handleReceiptRead } from "./handlers/receipt.handler";
import { handleRoomJoin, handleRoomLeave } from "./handlers/room.handler";
import { handleTypingStart, handleTypingStop } from "./handlers/typing.handler";
import { getPresenceTracker } from "./presence/presence-tracker";
import type {
  MessageSendPayload,
  PresencePingPayload,
  ReceiptReadPayload,
  RoomJoinPayload,
  RoomLeavePayload,
  TypingStartPayload,
  TypingStopPayload,
} from "./types";
import { getContactUserIds } from "./utils/get-contacts";

/**
 * Register all event handlers on socket connection
 * This is called for each new socket connection after authentication
 *
 * @param socket The connected socket instance
 */
export function registerSocketEventHandlers(socket: Socket): void {
  const userId = socket.data.userId as string;
  const presenceTracker = getPresenceTracker();

  logger.debug(
    `Socket ${socket.id}: Registering event handlers for user ${userId}`,
  );

  // ===== Room Management Events =====
  socket.on("room:join", (payload: RoomJoinPayload, ack) => {
    handleRoomJoin(socket, payload, ack).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in room:join:`, error);
    });
  });

  socket.on("room:leave", (payload: RoomLeavePayload, ack) => {
    handleRoomLeave(socket, payload, ack).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in room:leave:`, error);
    });
  });

  // ===== Message Events =====
  socket.on("message:send", (payload: MessageSendPayload, ack) => {
    handleMessageSend(socket, payload, ack).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in message:send:`, error);
    });
  });

  // ===== Read Receipt Events =====
  socket.on("receipt:read", (payload: ReceiptReadPayload, ack) => {
    handleReceiptRead(socket, payload, ack).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in receipt:read:`, error);
    });
  });

  // ===== Typing Indicator Events =====
  socket.on("typing:start", (payload: TypingStartPayload) => {
    handleTypingStart(socket, payload).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in typing:start:`, error);
    });
  });

  socket.on("typing:stop", (payload: TypingStopPayload) => {
    handleTypingStop(socket, payload).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in typing:stop:`, error);
    });
  });

  // ===== Presence Events =====
  socket.on("presence:ping", (payload: PresencePingPayload, ack) => {
    handlePresencePing(socket, payload, ack).catch((error) => {
      logger.error(`Socket ${socket.id}: Error in presence:ping:`, error);
    });
  });

  // ===== Disconnect Handler =====
  socket.on("disconnect", () => {
    logger.debug(`Socket ${socket.id}: User ${userId} disconnected`);

    // Remove socket from presence tracker
    const wentOffline = presenceTracker.removeSocket(userId, socket.id);

    if (wentOffline) {
      logger.debug(`Socket ${socket.id}: User ${userId} went offline`);

      // Broadcast presence update asynchronously (fire and forget)
      getContactUserIds(userId)
        .then((contactIds) => {
          for (const contactId of contactIds) {
            socket.to(`user:${contactId}`).emit("presence:update", {
              userId,
              status: "offline",
            });
          }
          logger.debug(
            `Socket ${socket.id}: Broadcast offline status to ${contactIds.length} contacts`,
          );
        })
        .catch((error) => {
          logger.error(
            `Socket ${socket.id}: Error broadcasting offline presence:`,
            error,
          );
        });
    }
  });

  logger.debug(`Socket ${socket.id}: Event handlers registered successfully`);
}

/**
 * Register event handlers for all future connections
 * Call this once during server initialization
 *
 * @param io The Socket.IO server instance
 */
export function registerConnectionHandler(io: Server): void {
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId as string;
    logger.info(`Socket ${socket.id}: New connection from user ${userId}`);

    // Add socket to presence tracker
    const presenceTracker = getPresenceTracker();
    const cameOnline = presenceTracker.addSocket(userId, socket.id);

    // Register all event handlers for this connection FIRST
    // This ensures handlers are ready before any async operations complete
    registerSocketEventHandlers(socket);

    // Broadcast presence update asynchronously (don't block connection)
    if (cameOnline) {
      logger.debug(`Socket ${socket.id}: User ${userId} came online`);

      // Fire and forget - don't await to avoid blocking connection
      getContactUserIds(userId)
        .then((contactIds) => {
          for (const contactId of contactIds) {
            io.to(`user:${contactId}`).emit("presence:update", {
              userId,
              status: "online",
            });
          }
          logger.debug(
            `Socket ${socket.id}: Broadcast online status to ${contactIds.length} contacts`,
          );
        })
        .catch((error) => {
          logger.error(
            `Socket ${socket.id}: Error broadcasting online presence:`,
            error,
          );
        });
    }
  });

  logger.info("Connection handler registered for Socket.IO server");
}
