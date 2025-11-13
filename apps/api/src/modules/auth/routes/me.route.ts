import { type NextFunction, type Response, Router } from "express";
import {
  type AuthenticatedRequest,
  authenticate,
} from "../middleware/authenticate";

/**
 * Get current user profile endpoint.
 *
 * Supports both web (cookie) and mobile (bearer token) authentication.
 *
 * Request headers:
 * - Cookie: session=<session-token> (for web)
 * - Authorization: Bearer <token> (for mobile/API)
 *
 * Response (200):
 * - user: { id, email, name, birthdate, emailVerified, createdAt, updatedAt, families }
 * - authType: "cookie" | "bearer-jwt" | "bearer-session"
 *
 * Response (401): Unauthorized (no valid session or token)
 */
export function createMeRoute(): Router {
  const router = Router();

  router.get(
    "/me",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // User is guaranteed to exist due to authenticate middleware
        if (!req.user) {
          res.status(500).json({ error: "User not found in request" });
          return;
        }

        // Extract session token from cookie for WebSocket authentication
        // The session cookie is HttpOnly, so we need to provide it for WebSocket connections
        let websocketToken: string | null = null;
        if (req.cookies) {
          websocketToken =
            req.cookies["__Secure-better-auth.session_token"] ||
            req.cookies["better-auth.session_token"] ||
            null;
        }

        res.status(200).json({
          user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            birthdate: req.user.birthdate,
            emailVerified: req.user.emailVerified,
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt,
            families: req.user.families || [],
          },
          authType: req.authType,
          // Provide session token for WebSocket authentication
          // This is safe because the /me endpoint is already authenticated
          websocketToken,
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
