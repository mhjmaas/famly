import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { validateObjectId } from "@lib/objectid-utils";
import type { ListFamiliesResponse } from "@modules/family/domain/family";
import { FamilyRepository } from "@modules/family/repositories/family.repository";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { FamilyService } from "@modules/family/services/family.service";
import { fromNodeHeaders } from "better-auth/node";
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from "express";
import { getAuth } from "../better-auth";

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     description: Authenticate user and create session (public endpoint)
 *     security: []  # Override global security - no authentication required
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               rememberMe:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                 session:
 *                   type: object
 *                 accessToken:
 *                   type: string
 *                 sessionToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 *
 * Login route using better-auth's built-in email/password sign-in.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required)
 * - rememberMe: boolean (optional, extends session duration)
 *
 * Response (200):
 * - user: { id, email, name, emailVerified, createdAt, updatedAt }
 * - session: { expiresAt }
 * - accessToken: JWT token (short-lived, stateless, for API requests)
 * - sessionToken: Session token (long-lived, database-backed, for token refresh)
 *
 * Response (401): Invalid credentials
 */
export function createLoginRoute(): Router {
  const router = Router();

  router.post(
    "/login",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const auth = getAuth();

        // Use better-auth's built-in signIn method
        const result = await auth.api.signInEmail({
          body: {
            email: req.body.email,
            password: req.body.password,
            rememberMe: req.body.rememberMe || false,
          },
          headers: fromNodeHeaders(req.headers),
          asResponse: true,
        });

        // Copy session cookie from better-auth response to our response (for web)
        // MUST be done BEFORE sending JSON response
        const setCookieHeader = result.headers.get("set-cookie");
        if (setCookieHeader) {
          res.setHeader("set-cookie", setCookieHeader);
        }

        // Parse the response body
        const data = (await result.json()) as {
          user?: {
            id: string;
            email: string;
            name: string;
            birthdate?: string | Date;
            emailVerified: boolean;
            createdAt: Date;
            updatedAt: Date;
          };
          token?: string;
          session?: {
            expiresAt?: string;
          };
        };

        if (!data.user) {
          throw HttpError.unauthorized("Invalid email or password");
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
          if (sessionData?.user) {
            fullUser = sessionData.user;
          }
        } catch (error) {
          logger.warn(
            "Failed to fetch full user session with additionalFields:",
            error,
          );
          // Continue with basic user data from signInEmail response
        }

        // Get JWT access token by calling the token endpoint with the session
        let accessToken: string | null = null;
        try {
          // @ts-expect-error - getToken is not in the type definitions but exists at runtime via jwt plugin
          const tokenResult = await auth.api.getToken({
            headers: {
              authorization: `Bearer ${sessionToken}`,
            },
          });
          accessToken = tokenResult.token;
          logger.debug("JWT token generated successfully");
        } catch (error) {
          logger.warn(
            "Failed to generate JWT token - continuing with session token only:",
            error,
          );
          // Gracefully degrade: session token still works for authentication
          // Client can request JWT later via /v1/auth/token endpoint if needed
        }

        // Set tokens in response headers for clients that prefer header extraction
        if (sessionToken) {
          res.setHeader("set-auth-token", sessionToken);
        }
        if (accessToken) {
          res.setHeader("set-auth-jwt", accessToken);
        }

        // Hydrate families for login response
        let families: ListFamiliesResponse = [];
        try {
          const familyService = new FamilyService(
            new FamilyRepository(),
            new FamilyMembershipRepository(),
          );
          const userId = validateObjectId(fullUser.id, "userId");
          families = await familyService.listFamiliesForUser(userId);
        } catch (error) {
          logger.error("Failed to load families for login response:", error);
          // Continue with empty families array
        }

        // Return user data with dual-token strategy
        res.status(200).json({
          user: {
            id: fullUser.id,
            email: fullUser.email,
            name: fullUser.name,
            birthdate: fullUser.birthdate,
            emailVerified: fullUser.emailVerified,
            createdAt: fullUser.createdAt,
            updatedAt: fullUser.updatedAt,
            families,
          },
          session: {
            expiresAt:
              data.session?.expiresAt ||
              new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          // Access token (JWT): Short-lived, stateless, for API requests
          accessToken: accessToken || null,
          // Session token: Long-lived, database-backed, for token refresh
          sessionToken: sessionToken || null,
        });
      } catch (error) {
        // Handle better-auth errors
        if (error && typeof error === "object" && "status" in error) {
          const authError = error as { status?: number; message?: string };
          if (
            authError.status === 401 ||
            authError.message?.includes("Invalid")
          ) {
            next(HttpError.unauthorized("Invalid email or password"));
          } else if (authError.status === 400) {
            next(
              HttpError.badRequest(authError.message || "Invalid login data"),
            );
          } else {
            next(error);
          }
        } else {
          next(error);
        }
      }
    },
  );

  return router;
}
