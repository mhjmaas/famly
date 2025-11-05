import type { Page } from "@playwright/test";

/**
 * Authentication helper for E2E tests
 *
 * This helper provides real authentication by:
 * 1. Creating/using real users via the API
 * 2. Getting real session tokens from better-auth
 * 3. Setting those tokens in the Playwright browser context
 *
 * This ensures tests work with the actual authentication flow including
 * middleware checks, session validation, and SessionGuard.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

/**
 * Counter for generating unique test user emails
 * Uses timestamp + random + process ID to avoid collisions across test runs and parallel workers
 */
let userCounter = Date.now();
let randomSuffix = Math.floor(Math.random() * 100000);
const pid = process.pid;

/**
 * Extracts the session token from Set-Cookie header
 */
function extractSessionCookie(setCookieHeader: string[]): string | null {
  if (!setCookieHeader) return null;

  for (const cookie of setCookieHeader) {
    if (cookie.includes("better-auth.session_token=")) {
      // Extract the token value (format: "better-auth.session_token=VALUE; Path=/; ...")
      const match = cookie.match(/better-auth\.session_token=([^;]+)/);
      return match ? match[1] : null;
    }
  }

  return null;
}

/**
 * Generate a unique email for test users
 */
function generateTestEmail(prefix = "e2etest"): string {
  userCounter++;
  return `${prefix}.${pid}.${randomSuffix}.${userCounter}@example.com`;
}

/**
 * Interface for authentication result
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  password: string;
  name: string;
  familyId?: string;
  sessionToken: string;
}

/**
 * Options for user authentication
 */
export interface AuthenticateOptions {
  /** Create a family for the user (default: false) */
  createFamily?: boolean;
  /** User name (default: "E2E Test User") */
  name?: string;
  /** Email prefix (default: "e2etest") */
  emailPrefix?: string;
  /** Password (default: "TestPassword123!") */
  password?: string;
  /** Birthdate (default: "1990-01-15") */
  birthdate?: string;
  /** Family name if creating family (default: "Test Family") */
  familyName?: string;
}

/**
 * Authenticates a user for E2E tests
 *
 * Creates a new user via the API, gets a real session token,
 * and sets it in the Playwright browser context.
 *
 * @param page - Playwright page object
 * @param options - Authentication options
 * @returns User data including session token
 *
 * @example
 * ```typescript
 * test('should access dashboard', async ({ page }) => {
 *   const user = await authenticateUser(page);
 *   await page.goto('/en-US/app');
 *   // ... test logic
 * });
 * ```
 *
 * @example With family
 * ```typescript
 * test('should show family data', async ({ page }) => {
 *   const user = await authenticateUser(page, { createFamily: true });
 *   await page.goto('/en-US/app/family');
 *   // ... test logic
 * });
 * ```
 */
export async function authenticateUser(
  page: Page,
  options: AuthenticateOptions = {},
): Promise<AuthenticatedUser> {
  const {
    createFamily = false,
    name = "E2E Test User",
    emailPrefix = "e2etest",
    password = "TestPassword123!",
    birthdate = "1990-01-15",
    familyName = "Test Family",
  } = options;

  const email = generateTestEmail(emailPrefix);

  // Step 1: Register user via API
  const registerResponse = await fetch(`${API_URL}/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      name,
      birthdate,
    }),
  });

  if (!registerResponse.ok) {
    const error = await registerResponse.text();
    throw new Error(
      `Failed to register test user: ${registerResponse.status} ${error}`,
    );
  }

  const registerData = await registerResponse.json();

  // Step 2: Extract session cookie from Set-Cookie header
  const setCookieHeaders = registerResponse.headers.getSetCookie();
  const sessionToken = extractSessionCookie(setCookieHeaders);

  if (!sessionToken) {
    throw new Error("No session token found in registration response");
  }

  const userId = registerData.user?.id;
  if (!userId) {
    throw new Error("No user ID returned from registration");
  }

  // Step 3: Set the real session cookie in Playwright context
  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  let familyId: string | undefined;

  // Step 4: Optionally create a family
  if (createFamily) {
    // Use accessToken if available, otherwise use session token
    const authToken = registerData.accessToken || registerData.sessionToken;

    if (!authToken) {
      throw new Error(
        `No auth token available in registration response. Response: ${JSON.stringify(
          registerData,
        )}`,
      );
    }

    const familyResponse = await fetch(`${API_URL}/v1/families`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        name: familyName,
      }),
    });

    if (!familyResponse.ok) {
      const error = await familyResponse.text();
      throw new Error(
        `Failed to create family: ${familyResponse.status} ${error}. Token used: ${authToken.substring(0, 20)}...`,
      );
    }

    const familyData = await familyResponse.json();
    familyId = familyData.familyId || familyData._id;
  }

  return {
    userId,
    email,
    password,
    name,
    familyId,
    sessionToken,
  };
}

/**
 * Authenticates multiple users for E2E tests
 *
 * Useful for testing features that require multiple users (e.g., chat, family members)
 *
 * @param page - Playwright page object
 * @param count - Number of users to create
 * @param options - Authentication options (applied to all users)
 * @returns Array of authenticated users
 *
 * @example
 * ```typescript
 * test('should support multi-user chat', async ({ page }) => {
 *   const [user1, user2] = await authenticateMultipleUsers(page, 2);
 *   // Switch between users as needed
 * });
 * ```
 */
export async function authenticateMultipleUsers(
  page: Page,
  count: number,
  options: AuthenticateOptions = {},
): Promise<AuthenticatedUser[]> {
  const users: AuthenticatedUser[] = [];

  for (let i = 0; i < count; i++) {
    const user = await authenticateUser(page, {
      ...options,
      emailPrefix: `${options.emailPrefix || "e2etest"}.user${i}`,
    });
    users.push(user);
  }

  return users;
}

/**
 * Switches the authenticated user in the current browser context
 *
 * @param page - Playwright page object
 * @param user - User to switch to (from authenticateUser result)
 *
 * @example
 * ```typescript
 * test('should switch between users', async ({ page }) => {
 *   const [user1, user2] = await authenticateMultipleUsers(page, 2);
 *
 *   // Test as user1
 *   await page.goto('/en-US/app');
 *
 *   // Switch to user2
 *   await switchUser(page, user2);
 *   await page.goto('/en-US/app');
 * });
 * ```
 */
export async function switchUser(
  page: Page,
  user: AuthenticatedUser,
): Promise<void> {
  // Clear existing cookies
  await page.context().clearCookies();

  // Set new user's session cookie
  await page.context().addCookies([
    {
      name: "better-auth.session_token",
      value: user.sessionToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Clears authentication (logs out)
 *
 * @param page - Playwright page object
 *
 * @example
 * ```typescript
 * test('should handle logout', async ({ page }) => {
 *   await authenticateUser(page);
 *   await page.goto('/en-US/app');
 *
 *   await clearAuthentication(page);
 *   await page.goto('/en-US/app');
 *   // Should redirect to signin
 * });
 * ```
 */
export async function clearAuthentication(page: Page): Promise<void> {
  await page.context().clearCookies();
}
