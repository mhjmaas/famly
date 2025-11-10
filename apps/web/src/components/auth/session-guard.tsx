"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/lib/api-client";

/**
 * Client component to handle invalid session detection
 * If user data fails to load but we're on a protected route,
 * clear the invalid cookie and redirect to signin
 */
export function SessionGuard({
  hasSessionCookie,
  hasUserData,
  locale,
}: {
  hasSessionCookie: boolean;
  hasUserData: boolean;
  locale: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isProtectedRoute = pathname.startsWith(`/${locale}/app`);

    if (isProtectedRoute) {
      // Case 1: Has session cookie but no user data (invalid/expired session)
      if (hasSessionCookie && !hasUserData) {
        console.warn(
          "Invalid session detected on protected route, clearing and redirecting",
        );

        // Call logout endpoint to properly invalidate session
        logout()
          .then(() => {
            // Redirect to signin
            router.push(`/${locale}/signin`);
          })
          .catch(() => {
            // Even if logout fails, still redirect to signin
            router.push(`/${locale}/signin`);
          });
      }
      // Case 2: No session cookie at all (logged out or never logged in)
      else if (!hasSessionCookie && !hasUserData) {
        console.warn(
          "No session found on protected route, redirecting to signin",
        );
        router.push(`/${locale}/signin`);
      }
    }
  }, [hasSessionCookie, hasUserData, pathname, locale, router]);

  return null;
}
