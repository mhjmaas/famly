import { settings } from "@config/settings";
import { getDb } from "@infra/mongo/client";
import { betterAuth as betterAuthInit } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { bearer, jwt, customSession } from "better-auth/plugins";
import { ObjectId } from "mongodb";

let authInstance: any = null;

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
        } catch (error) {
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
