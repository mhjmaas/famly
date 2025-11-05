/**
 * Data Access Layer (DAL)
 *
 * This module provides secure, cached data access functions following Next.js best practices.
 * All functions verify authentication and use React's cache() to prevent duplicate requests.
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 */

import "server-only";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { i18n, type Locale } from "@/i18n/config";
import {
  type ActivityEvent,
  ApiError,
  getActivityEvents,
  getKarmaBalance,
  getMe,
  type KarmaBalance,
  type MeResponse,
  type UserProfile,
} from "./api-client";
import { getCookieHeader } from "./server-cookies";

const supportedLocales = new Set<string>(i18n.locales);

function normalizeLocale(locale?: string): Locale {
  if (locale && supportedLocales.has(locale)) {
    return locale as Locale;
  }

  return i18n.defaultLocale as Locale;
}

function getSigninPath(locale?: string) {
  const normalized = normalizeLocale(locale);
  return `/${normalized}/signin`;
}

/**
 * Session verification
 *
 * Verifies that the user has a valid session cookie.
 * This is an optimistic check - the backend still validates the actual session.
 *
 * @returns Session information including cookie value
 * @throws Redirects to signin if no valid session
 */
export const verifySession = cache(async (locale?: Locale) => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("better-auth.session_token");

  if (!sessionCookie?.value) {
    redirect(getSigninPath(locale));
  }

  return {
    isAuthenticated: true,
    cookieValue: sessionCookie.value,
  };
});

/**
 * Get cookie header for API calls
 *
 * Retrieves all cookies formatted as a header string.
 * Cached to prevent multiple cookie reads in a single request.
 */
const getCookieHeaderCached = cache(async () => {
  return getCookieHeader();
});

/**
 * Get current user profile
 *
 * Fetches the authenticated user's profile from the backend.
 * Uses React cache to prevent duplicate requests during SSR.
 *
 * @returns User profile data
 * @throws Redirects to signin if authentication fails
 */
export const getUser = cache(async (locale?: Locale): Promise<UserProfile> => {
  // Verify session exists (optimistic check)
  await verifySession(locale);

  try {
    // Forward cookies to backend for validation
    const cookieHeader = await getCookieHeaderCached();
    const response: MeResponse = await getMe(cookieHeader);

    return response.user;
  } catch (error) {
    // Handle authentication errors
    if (error instanceof ApiError && error.isAuthError()) {
      // Session cookie exists but is invalid - redirect to signin
      redirect(getSigninPath(locale));
    }

    // Re-throw other errors
    throw error;
  }
});

/**
 * Get user's karma balance
 *
 * Fetches karma balance for the authenticated user.
 * Returns 0 if user has no families or karma fetch fails.
 *
 * @returns Karma balance number
 */
export const getUserKarma = cache(async (locale?: Locale): Promise<number> => {
  try {
    const user = await getUser(locale);

    // User must have at least one family to have karma
    if (!user.families?.[0]?.familyId) {
      return 0;
    }

    const cookieHeader = await getCookieHeaderCached();
    const karmaData: KarmaBalance = await getKarmaBalance(
      user.families[0].familyId,
      user.id,
      cookieHeader,
    );

    return karmaData.balance;
  } catch (error) {
    // Re-throw redirect errors (not actual errors)
    if (isRedirectError(error)) {
      throw error;
    }

    // Log karma fetch errors but don't fail the entire request
    console.warn("Failed to fetch karma balance:", error);
    return 0;
  }
});

/**
 * Get user's activity events
 *
 * Fetches activity events for the authenticated user.
 * Returns empty array if fetch fails.
 *
 * @param startDate - Optional start date filter (ISO 8601)
 * @param endDate - Optional end date filter (ISO 8601)
 * @returns Array of activity events
 */
export const getUserActivityEvents = cache(
  async (
    startDate?: string,
    endDate?: string,
    locale?: Locale,
  ): Promise<ActivityEvent[]> => {
    try {
      // Verify session exists
      await verifySession(locale);

      const cookieHeader = await getCookieHeaderCached();
      const events = await getActivityEvents(startDate, endDate, cookieHeader);

      return events;
    } catch (error) {
      // Re-throw redirect errors (not actual errors)
      if (isRedirectError(error)) {
        throw error;
      }

      // Log error but return empty array rather than failing
      console.warn("Failed to fetch activity events:", error);
      return [];
    }
  },
);

/**
 * Get user profile with karma
 *
 * Convenience function that fetches both user profile and karma in parallel.
 * Uses Promise.all for optimal performance.
 *
 * @returns Object containing user profile and karma balance
 */
export const getUserWithKarma = cache(
  async (locale?: Locale): Promise<{ user: UserProfile; karma: number }> => {
    // Fetch both in parallel for better performance
    const [user, karma] = await Promise.all([
      getUser(locale),
      getUserKarma(locale),
    ]);

    return { user, karma };
  },
);
