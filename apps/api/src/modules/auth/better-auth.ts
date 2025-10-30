import { settings } from "@config/settings";
import { getDb } from "@infra/mongo/client";
import { sendPasswordResetEmail } from "@lib/email";
import { logger } from "@lib/logger";
import bcrypt from "bcrypt";
import { betterAuth as betterAuthInit } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer, customSession, jwt } from "better-auth/plugins";
import { ObjectId } from "mongodb";

let authInstance: ReturnType<typeof betterAuthInit> | null = null;

/**
 * Initialize Better Auth with dual-token authentication strategy.
 *
 * Token Strategy:
 * ---------------
 * 1. Access Token (JWT): Short-lived (15 min), stateless, verifiable with JWKS
 * 2. Session Token: Long-lived (14 days), database-backed, rolling expiration
 *
 * Flow:
 * -----
 * - Web: Uses cookies (automatic session management)
 * - Mobile: Gets both tokens on login/register
 *   → Use accessToken (JWT) for API requests (fast, stateless, no DB lookup)
 *   → When accessToken expires, use sessionToken to get new accessToken via /v1/auth/token
 *   → sessionToken auto-refreshes on use (rolling session)
 *
 * All authentication endpoints (sign-in, sign-up) return:
 * - user: User object
 * - session: { expiresAt }
 * - accessToken: JWT token (short-lived, stateless, for API requests)
 * - sessionToken: Session token (long-lived, database-backed, for token refresh)
 */
function initAuth() {
  if (authInstance) {
    return authInstance;
  }

  const config = {
    appName: "Famly",
    baseURL: settings.betterAuthUrl,
    basePath: "/v1/auth",
    secret: settings.betterAuthSecret,

    database: mongodbAdapter(getDb()),

    emailAndPassword: {
      enabled: true,
      // Auto sign-in after registration for web flow
      autoSignIn: true,
      // Minimum password length
      minPasswordLength: 8,
      // Custom password hashing with environment-specific bcrypt rounds
      password: {
        hash: async (password: string) => {
          // Use 4 rounds during testing for speed, 10 rounds in production for security
          // Testing: 1 rounds = ~8ms (fast e2e tests)
          // Production: 10 rounds = ~1024ms (secure but slower)
          const rounds = settings.isTest ? 1 : 10;
          return await bcrypt.hash(password, rounds);
        },
        verify: async ({
          hash,
          password,
        }: {
          hash: string;
          password: string;
        }) => {
          return await bcrypt.compare(password, hash);
        },
      },
      // Password reset configuration
      sendResetPassword: async ({ user, url, token }, _request: Request) => {
        // IMPORTANT: This callback is triggered by Better Auth when a password reset is requested
        // It receives the user object, the complete reset URL with token, and the raw token
        console.log("========================");
        console.log("sendResetPassword callback TRIGGERED!");
        console.log("User:", user.id, user.email);
        console.log("URL:", url);
        console.log("Token:", token);
        console.log("========================");

        logger.warn("sendResetPassword callback TRIGGERED!", {
          userId: user.id,
          email: user.email,
          hasUrl: Boolean(url),
          hasToken: Boolean(token),
        });
        try {
          await sendPasswordResetEmail(user.email, url, token);
          logger.info("Password reset email sent", {
            userId: user.id,
            email: user.email,
          });
        } catch (error) {
          logger.error("Failed to send password reset email", {
            userId: user.id,
            email: user.email,
            error: error instanceof Error ? error.message : String(error),
          });
          // Don't throw - we don't want to crash the app if email fails
          // Better Auth will still return success to prevent email enumeration
        }
      },
      // Token expires after 1 hour
      resetPasswordTokenExpiresIn: 3600, // 1 hour in seconds
      // Callback executed after successful password reset
      onPasswordReset: async ({ user }, _request: Request) => {
        logger.info("Password reset successful", {
          userId: user.id,
          email: user.email,
        });
      },
    },

    // Extend user schema with custom profile fields
    user: {
      additionalFields: {
        birthdate: {
          type: "date" as const,
          required: true,
          input: true, // Allow users to provide value during signup
        },
      },
    },

    // Enable bearer token plugin for mobile/API clients and JWT for stateless auth
    // Note: JWT tokens are stateless and don't include families claim
    // Families are hydrated in the authenticate middleware for both JWT and session-based auth
    plugins: [
      customSession(async ({ user, session }) => {
        // Note: better-auth doesn't automatically include additionalFields in the user object
        // We need to manually fetch them from MongoDB for all user/session responses
        try {
          const db = getDb();
          const fullUser = await db
            .collection("user")
            .findOne({ _id: new ObjectId(user.id) });

          return {
            user: {
              ...user,
              // Include additionalFields from database
              birthdate: fullUser?.birthdate ?? null,
            },
            session,
          };
        } catch (_error) {
          // If fetch fails, return user without additionalFields
          // The client can fetch from /me endpoint if needed
          return {
            user,
            session,
          };
        }
      }),
      bearer(),
      jwt(),
    ],

    session: {
      // Session expires after 14 days
      expiresIn: 60 * 60 * 24 * 14, // 14 days in seconds
      // Update session activity on each request
      updateAge: 60 * 60 * 24, // Update once per day
    },

    advanced: {
      // Use secure cookies in production
      useSecureCookies: !settings.isDevelopment,
      // Disable CSRF check in development
      disableCSRFCheck: settings.isDevelopment,
    },
  };

  authInstance = betterAuthInit(config);

  return authInstance;
}

// Lazy-load auth to avoid initializing before DB connection
export function getAuth() {
  return initAuth();
}

/**
 * Reset the auth instance.
 * Useful for testing to ensure clean state between test files.
 */
export function resetAuth(): void {
  authInstance = null;
}
