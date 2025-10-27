import { randomUUID } from "node:crypto";
import { logger } from "@lib/logger";
import type { Socket } from "socket.io";
import { z } from "zod";
import type { Ack, PresencePingPayload } from "../types";

// Validation schema for presence ping
const presenceSchema = z.object({
  // Presence ping has minimal payload - just needs to be a valid event
});

/**
 * Handle presence:ping event
 * Updates user's last-seen timestamp and returns server time
 *
 * @param socket Socket.IO socket instance
 * @param payload Event payload
 * @param ack Acknowledgment callback
 */
export async function handlePresencePing(
  socket: Socket,
  payload: PresencePingPayload,
  ack: (response: Ack<{ serverTime: string }>) => void,
): Promise<void> {
  const userId = socket.data.userId as string;
  const correlationId = randomUUID();

  try {
    // Validate payload (minimal validation for ping)
    const validation = presenceSchema.safeParse(payload || {});
    if (!validation.success) {
      logger.debug(
        `Socket ${socket.id}: Presence ping validation failed: ${validation.error.message}`,
      );
      return ack({
        ok: false,
        error: "VALIDATION_ERROR",
        message: validation.error.message,
        correlationId,
      });
    }

    const serverTime = new Date().toISOString();

    logger.debug(`Socket ${socket.id}: User ${userId} sent presence ping`);

    // Send success ack with server time
    ack({
      ok: true,
      data: { serverTime },
    });
  } catch (error) {
    const errorCorrelationId = randomUUID();
    logger.error(
      `Socket ${socket.id}: Presence ping error:`,
      error instanceof Error ? error.message : String(error),
    );
    ack({
      ok: false,
      error: "INTERNAL",
      message: "Internal server error",
      correlationId: errorCorrelationId,
    });
  }
}
