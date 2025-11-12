/**
 * Server-side cookie utilities
 * This file can only be imported in Server Components
 */

import "server-only";
import type { RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

/**
 * Session cookie names used by better-auth
 * When useSecureCookies is enabled, better-auth adds the __Secure- prefix
 */
const SESSION_COOKIE_NAMES = {
  secure: "__Secure-better-auth.session_token",
  standard: "better-auth.session_token",
} as const;

/**
 * Get the session cookie regardless of secure/non-secure prefix
 * Checks both __Secure- prefixed (HTTPS) and standard (HTTP) cookie names
 *
 * @returns The session cookie if found, undefined otherwise
 */
export async function getSessionCookie(): Promise<RequestCookie | undefined> {
  const cookieStore = await cookies();
  return (
    cookieStore.get(SESSION_COOKIE_NAMES.secure) ||
    cookieStore.get(SESSION_COOKIE_NAMES.standard)
  );
}

/**
 * Converts Next.js cookies to Cookie header format for API requests
 * Only use this in Server Components!
 *
 * @returns Cookie header string in format "name1=value1; name2=value2"
 */
export async function getCookieHeader(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

/**
 * Check if a session cookie exists
 */
export async function hasSessionCookie(): Promise<boolean> {
  const sessionCookie = await getSessionCookie();
  return !!sessionCookie?.value;
}
