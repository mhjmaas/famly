import type { Socket } from "socket.io";
import { logger } from "@lib/logger";
import { isJWT, verifyJWT } from "@modules/auth/middleware/jwt-verify";
import { getAuth } from "@modules/auth/better-auth";

/**
 * Authenticate Socket.IO connections using JWT or session tokens
 * Extracts token from socket.handshake.auth.token or query parameter
 * Validates using existing auth infrastructure
 * Stores userId on socket.data for authorization
 *
 * @param socket Socket.IO socket instance
 * @param next Callback to proceed or reject connection
 */
export async function authenticateSocket(
  socket: Socket,
  next: (error?: Error) => void,
): Promise<void> {
  try {
    // Extract token from auth payload or query
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.query?.token as string | undefined);

    if (!token) {
      const error = new Error("Authentication token required");
      logger.debug(`Socket ${socket.id}: Missing authentication token`);
      return next(error);
    }

    let userId: string | undefined;

    // Check if token is JWT or session token
    if (isJWT(token)) {
      // Verify JWT token (stateless)
      const payload = await verifyJWT(token);
      userId = payload.sub as string | undefined;

      if (!userId) {
        const error = new Error("Invalid JWT token: missing user id");
        logger.debug(`Socket ${socket.id}: Invalid JWT token structure`);
        return next(error);
      }

      logger.debug(`Socket ${socket.id}: Authenticated via JWT (userId: ${userId})`);
    } else {
      // Verify session token (database-backed)
      const auth = getAuth();
      const session = await auth.api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${token}`,
        }),
      });

      if (!session?.user?.id) {
        const error = new Error("Invalid session token");
        logger.debug(`Socket ${socket.id}: Invalid session token`);
        return next(error);
      }

      userId = session.user.id;
      logger.debug(
        `Socket ${socket.id}: Authenticated via session token (userId: ${userId})`,
      );
    }

    // Store userId on socket data for subsequent event authorization
    socket.data.userId = userId;

    // Auto-join socket to user's private room for targeted broadcasts
    socket.join(`user:${userId}`);

    logger.debug(`Socket ${socket.id}: Auto-joined user:${userId} room`);
    next();
  } catch (error) {
    logger.error(
      `Socket ${socket.id}: Authentication error:`,
      error instanceof Error ? error.message : String(error),
    );
    const authError = new Error("Authentication failed");
    next(authError);
  }
}
