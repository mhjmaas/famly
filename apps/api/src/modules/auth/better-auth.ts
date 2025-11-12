import { settings } from "@config/settings";
import { getDb } from "@infra/mongo/client";
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
      // Enable secure cookies when BETTER_AUTH_URL uses HTTPS
      // Works correctly with reverse proxies (like Caddy) because Express trusts
      // X-Forwarded-Proto header (configured via app.set('trust proxy', 1))
      // This ensures cookies have the Secure flag when accessed over HTTPS
      useSecureCookies: settings.isHttps,
      // Disable CSRF check in development and test
      disableCSRFCheck: settings.isDevelopment || settings.isTest,
      // Trust X-Forwarded-For and X-Real-IP headers from reverse proxy (Caddy)
      // This ensures client IP addresses are correctly identified behind the proxy
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
      // Configure default cookie attributes
      // SameSite: 'lax' allows cookies to be sent in same-site contexts and top-level navigation
      // This is important for reverse proxy setups where the frontend and API are on the same domain
      defaultCookieAttributes: {
        sameSite: "lax" as const,
        path: "/",
      },
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
