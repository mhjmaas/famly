"use server";

import "server-only";
import { cookies } from "next/headers";

/**
 * Server action to clear invalid session cookies
 * This is needed because cookies can only be modified in Server Actions or Route Handlers
 */
export async function clearInvalidSession() {
  const cookieStore = await cookies();

  // Delete both possible session cookie names
  // When useSecureCookies is enabled, better-auth adds the __Secure- prefix
  cookieStore.delete("__Secure-better-auth.session_token");
  cookieStore.delete("better-auth.session_token");

  return { success: true };
}
