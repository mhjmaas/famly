"use server";

import "server-only";
import { cookies } from "next/headers";

/**
 * Server action to clear invalid session cookies
 * This is needed because cookies can only be modified in Server Actions or Route Handlers
 */
export async function clearInvalidSession() {
  const cookieStore = await cookies();

  // Delete the session token cookie
  cookieStore.delete("better-auth.session_token");

  return { success: true };
}
