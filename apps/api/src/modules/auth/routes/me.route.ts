import { Router, Response, NextFunction } from 'express';
import { authenticate, type AuthenticatedRequest } from '../middleware/authenticate';

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
 * - user: { id, email, name, emailVerified, createdAt, updatedAt }
 * - authType: "cookie" | "bearer"
 *
 * Response (401): Unauthorized (no valid session or token)
 */
export function createMeRoute(): Router {
  const router = Router();

  router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // User is guaranteed to exist due to authenticate middleware
      res.status(200).json({
        user: {
          id: req.user!.id,
          email: req.user!.email,
          name: req.user!.name,
          emailVerified: req.user!.emailVerified,
          createdAt: req.user!.createdAt,
          updatedAt: req.user!.updatedAt,
        },
        authType: req.authType,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
