/**
 * Server-side cookie utilities
 * This file can only be imported in Server Components
 */

import "server-only";
import { cookies } from "next/headers";

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
 * Check if a specific cookie exists
 */
export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return !!cookieStore.get("better-auth.session_token");
}
