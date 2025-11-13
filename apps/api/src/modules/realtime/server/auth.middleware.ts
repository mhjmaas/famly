import { logger } from "@lib/logger";
import { getAuth } from "@modules/auth/better-auth";
import { isJWT, verifyJWT } from "@modules/auth/middleware/jwt-verify";
import type { Socket } from "socket.io";

const SESSION_COOKIE_NAMES = [
  "__Secure-better-auth.session_token",
  "better-auth.session_token",
];

/**
 * Authenticate Socket.IO connections using JWT or session tokens
 * Extracts token from socket.handshake.auth.token, query parameter, or cookies
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

    const cookieSession = extractSessionTokenFromSocket(socket);

    if (!token && !cookieSession) {
      const error = new Error("Authentication token required");
      logger.debug(
        `Socket ${socket.id}: Missing authentication token and session cookie`,
      );
      return next(error);
    }

    let userId: string | undefined;

    if (token) {
      if (isJWT(token)) {
        // Verify JWT token (stateless)
        const payload = await verifyJWT(token);
        userId = payload.sub as string | undefined;

        if (!userId) {
          const error = new Error("Invalid JWT token: missing user id");
          logger.debug(`Socket ${socket.id}: Invalid JWT token structure`);
          return next(error);
        }

        logger.debug(
          `Socket ${socket.id}: Authenticated via JWT (userId: ${userId})`,
        );
      } else {
        // Session token provided explicitly via auth payload
        // Use the non-secure cookie name for compatibility
        userId = await verifySessionToken(
          token,
          "better-auth.session_token",
          socket.id,
          false,
        );
      }
    } else if (cookieSession) {
      // Fallback to HttpOnly cookie session token for browsers
      userId = await verifySessionToken(
        cookieSession.token,
        cookieSession.cookieName,
        socket.id,
        true,
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

async function verifySessionToken(
  token: string,
  cookieName: string,
  socketId: string,
  fromCookie = false,
): Promise<string> {
  const auth = getAuth();
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: `${cookieName}=${token}`,
    }),
  });

  if (!session?.user?.id) {
    const error = new Error("Invalid session token");
    logger.debug(
      `Socket ${socketId}: Invalid session token${fromCookie ? " from cookie" : ""} (cookieName: ${cookieName})`,
    );
    throw error;
  }

  logger.debug(
    `Socket ${socketId}: Authenticated via session token${fromCookie ? " (cookie)" : ""} (userId: ${session.user.id}, cookieName: ${cookieName})`,
  );
  return session.user.id;
}

function extractSessionTokenFromSocket(
  socket: Socket,
): { token: string; cookieName: string } | null {
  const cookieHeader =
    socket.handshake.headers?.cookie || socket.request?.headers?.cookie;

  if (!cookieHeader) {
    logger.debug(
      `Socket ${socket.id}: No cookie header found in handshake or request`,
    );
    return null;
  }

  logger.debug(
    `Socket ${socket.id}: Cookie header present, length: ${cookieHeader.length}`,
  );

  const cookies = parseCookies(cookieHeader);
  for (const name of SESSION_COOKIE_NAMES) {
    const value = cookies[name];
    if (value) {
      logger.debug(
        `Socket ${socket.id}: Found session cookie: ${name}, token length: ${value.length}`,
      );
      return { token: value, cookieName: name };
    }
  }

  logger.debug(
    `Socket ${socket.id}: No session cookie found. Available cookies: ${Object.keys(cookies).join(", ")}`,
  );
  return null;
}

function parseCookies(header: string): Record<string, string> {
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const trimmed = part.trim();
    if (!trimmed) {
      return acc;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      return acc;
    }

    const name = trimmed.slice(0, separatorIndex).trim();
    if (!name) {
      return acc;
    }

    const value = trimmed.slice(separatorIndex + 1).trim();
    // Decode URL-encoded cookie values (e.g., %3D -> =)
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {});
}
