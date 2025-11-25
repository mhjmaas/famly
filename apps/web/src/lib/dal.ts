/**
 * Data Access Layer (DAL)
 *
 * This module provides secure, cached data access functions following Next.js best practices.
 * All functions verify authentication and use React's cache() to prevent duplicate requests.
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 */

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { cache } from "react";
import { i18n, type Locale } from "@/i18n/config";
import "server-only";
import {
  type ActivityEvent,
  ApiError,
  type ChatWithPreviewDTO,
  type FamilySettings,
  type FamilyWithMembers,
  getActivityEvents,
  getChats,
  getFamilies,
  getFamilySettings,
  getKarmaBalance,
  getMe,
  type KarmaBalance,
  type MeResponse,
  type UserProfile,
} from "./api-client";
import { getCookieHeader, getSessionCookie } from "./server-cookies";

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
  const sessionCookie = await getSessionCookie();

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
 * Get authenticated cookie header
 *
 * Ensures the session exists before returning all cookies formatted as
 * a header string. Cached per-locale to avoid duplicate verification.
 */
const getAuthenticatedCookieHeader = cache(async (locale?: Locale) => {
  await verifySession(locale);
  return getCookieHeaderCached();
});

interface AuthenticatedUserContext {
  user: UserProfile;
  cookieHeader: string;
}

const getAuthenticatedUserContext = cache(
  async (locale?: Locale): Promise<AuthenticatedUserContext> => {
    const cookieHeader = await getAuthenticatedCookieHeader(locale);

    try {
      const response: MeResponse = await getMe(cookieHeader);
      return { user: response.user, cookieHeader };
    } catch (error) {
      if (error instanceof ApiError && error.isAuthError()) {
        redirect(getSigninPath(locale));
      }

      throw error;
    }
  },
);

async function resolveKarmaForUser(
  user: UserProfile,
  cookieHeader: string,
): Promise<number> {
  if (!user.families?.[0]?.familyId) {
    return 0;
  }

  const karmaData: KarmaBalance = await getKarmaBalance(
    user.families[0].familyId,
    user.id,
    cookieHeader,
  );

  return karmaData.totalKarma;
}

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
  const { user } = await getAuthenticatedUserContext(locale);
  return user;
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
    const { user, cookieHeader } = await getAuthenticatedUserContext(locale);
    return await resolveKarmaForUser(user, cookieHeader);
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
      const cookieHeader = await getAuthenticatedCookieHeader(locale);
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
    const { user, cookieHeader } = await getAuthenticatedUserContext(locale);
    const karma = await resolveKarmaForUser(user, cookieHeader);
    return { user, karma };
  },
);

/**
 * Get user profile with karma and family settings
 *
 * Fetches user profile, karma balance, and family settings in parallel.
 * This is used in the root layout to preload all necessary data for SSR.
 *
 * @returns Object containing user profile, karma balance, and family settings
 */
export const getUserWithKarmaAndSettings = cache(
  async (
    locale?: Locale,
  ): Promise<{
    user: UserProfile;
    karma: number;
    settings: FamilySettings | null;
  }> => {
    const { user, cookieHeader } = await getAuthenticatedUserContext(locale);

    // Get the first family ID (users always have at least one family)
    const familyId = user.families?.[0]?.familyId;

    if (!familyId) {
      // If no family, return user and karma only
      const karma = await resolveKarmaForUser(user, cookieHeader);
      return { user, karma, settings: null };
    }

    // Fetch karma and settings in parallel for optimal performance
    const [karma, settings] = await Promise.all([
      resolveKarmaForUser(user, cookieHeader),
      getFamilySettings(familyId, cookieHeader).catch((error) => {
        // Log error but don't fail the entire request
        // Return null settings to fail open (all features enabled by default)
        console.warn("Failed to fetch family settings:", error);
        return null;
      }),
    ]);

    return { user, karma, settings };
  },
);

/**
 * Get chats for the current user (server-side, uses session cookie)
 *
 * This mirrors the SSR preload pattern used for features/navigation to
 * avoid client-side loading flicker on the chat list.
 */
export const getChatsForCurrentUser = cache(
  async (locale?: Locale): Promise<ChatWithPreviewDTO[]> => {
    const { cookieHeader } = await getAuthenticatedUserContext(locale);
    const response = await getChats(undefined, undefined, {
      cookie: cookieHeader,
    });
    return response.chats;
  },
);

/**
 * Get families (with members) for the current user (server-side)
 * Hydrates family state so DM chat titles have member names immediately.
 */
export const getFamiliesForCurrentUser = cache(
  async (locale?: Locale): Promise<FamilyWithMembers[]> => {
    const { cookieHeader } = await getAuthenticatedUserContext(locale);
    return getFamilies(cookieHeader);
  },
);
