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
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
