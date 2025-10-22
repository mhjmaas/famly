import { HttpError } from '@lib/http-error';
import { logger } from '@lib/logger';
import { fromNodeHeaders } from 'better-auth/node';
import { NextFunction, Request, Response, Router } from 'express';
import { getAuth } from '../better-auth';
import { registerValidator } from '../validators/register.validator';

/**
 * Register route using better-auth's built-in email/password registration.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required, min 8 characters)
 * - name: string (required)
 * - birthdate: string (required, ISO 8601 format YYYY-MM-DD)
 *
 * Response (201):
 * - user: { id, email, name, birthdate, emailVerified, createdAt, updatedAt }
 * - session: { expiresAt }
 * - accessToken: JWT token (short-lived, stateless, for API requests)
 * - sessionToken: Session token (long-lived, database-backed, for token refresh)
 *
 * Response (400): Validation error
 * Response (409): Email already exists
 */
export function createRegisterRoute(): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate input
      const validationResult = registerValidator.safeParse(req.body);
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        throw HttpError.badRequest(firstError.message);
      }

      const { email, password, name, birthdate } = validationResult.data;
      const auth = getAuth();

      // Use better-auth's built-in signUp method with birthdate
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name,
          birthdate, // Better-auth will handle the date field automatically
        },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      // Check HTTP status from Better Auth
      if (!result.ok) {
        const errorData = await result.json();
        const errorMsg = typeof errorData.error === 'string' ? errorData.error : (errorData.error?.message || errorData.message || '');

        // Check for duplicate email - Better Auth may return various error messages
        if (errorMsg.toLowerCase().includes('already') ||
          errorMsg.toLowerCase().includes('exist') ||
          errorMsg.toLowerCase().includes('duplicate') ||
          errorMsg.toLowerCase().includes('unique') ||
          (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('taken'))) {
          throw HttpError.conflict('Email already registered');
        }

        throw HttpError.badRequest(errorMsg || 'Registration failed');
      }

      // Copy session cookie from better-auth response to our response (for web)
      // MUST be done BEFORE sending JSON response
      const setCookieHeader = result.headers.get('set-cookie');
      if (setCookieHeader) {
        res.setHeader('set-cookie', setCookieHeader);
      }

      // Parse the response body
      const data = await result.json();

      // At this point result.ok is true, so we should have a user
      if (!data.user) {
        throw HttpError.badRequest('Registration failed');
      }

      // Extract session token from Better Auth response
      const sessionToken = data.token; // Session token (long-lived, database-backed)

      // Get session with additionalFields via customSession plugin
      let fullUser = data.user;
      try {
        const sessionData = await auth.api.getSession({
          headers: {
            authorization: `Bearer ${sessionToken}`,
          },
        });
        if (sessionData.user) {
          fullUser = sessionData.user;
        }
      } catch (error) {
        logger.warn('Failed to fetch full user session with additionalFields:', error);
        // Continue with basic user data from signUpEmail response
      }

      // Get JWT access token by calling the token endpoint with the session
      let accessToken: string | null = null;
      try {
        const tokenResult = await auth.api.getToken({
          headers: {
            authorization: `Bearer ${sessionToken}`,
          },
        });
        accessToken = tokenResult.token;
        logger.debug('JWT token generated successfully');
      } catch (error) {
        logger.warn('Failed to generate JWT token - continuing with session token only:', error);
        // Gracefully degrade: session token still works for authentication
        // Client can request JWT later via /v1/auth/token endpoint if needed
      }

      // Set tokens in response headers for clients that prefer header extraction
      if (sessionToken) {
        res.setHeader('set-auth-token', sessionToken);
      }
      if (accessToken) {
        res.setHeader('set-auth-jwt', accessToken);
      }

      // Return user data with dual-token strategy
      res.status(201).json({
        user: {
          id: fullUser.id,
          email: fullUser.email,
          name: fullUser.name,
          birthdate: fullUser.birthdate,
          emailVerified: fullUser.emailVerified,
          createdAt: fullUser.createdAt,
          updatedAt: fullUser.updatedAt,
          families: [], // New users have no families yet
        },
        session: {
          expiresAt: data.session?.expiresAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        },
        // Access token (JWT): Short-lived, stateless, for API requests
        accessToken: accessToken || null,
        // Session token: Long-lived, database-backed, for token refresh
        sessionToken: sessionToken || null,
      });
    } catch (error) {
      // Pass errors to Express error handler
      next(error);
    }
  });

  return router;
}
