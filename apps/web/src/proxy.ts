import { getFeatureRoutes } from "@famly/shared";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18n, type Locale } from "@/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;
const SUPPORTED_LOCALES = new Set<Locale>(i18n.locales);

function getLocale(request: NextRequest): Locale {
  // Parse the Accept-Language header and match against supported locales.
  const headers: Record<string, string> = {};
  const acceptLanguage = request.headers.get("accept-language");

  if (acceptLanguage) {
    headers["accept-language"] = acceptLanguage;
  }

  const languages = new Negotiator({ headers }).languages();
  const canonicalLanguages = languages.filter((language) => {
    try {
      return Intl.getCanonicalLocales(language).length > 0;
    } catch {
      return false;
    }
  });

  const locale = match(
    canonicalLanguages.length ? canonicalLanguages : [i18n.defaultLocale],
    i18n.locales,
    i18n.defaultLocale,
  );

  return (
    i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale
  ) as Locale;
}

async function getStoredLanguageFromSession(
  request: NextRequest,
): Promise<Locale | null> {
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");

  if (!sessionCookie) {
    return null;
  }

  try {
    const API_BASE_URL =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";

    const meResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: {
        Cookie: `${sessionCookie.name}=${sessionCookie.value}`,
      },
      cache: "no-store",
    });

    if (!meResponse.ok) {
      return null;
    }

    const meData = (await meResponse.json()) as {
      user?: { language?: string };
    };

    const lang = meData.user?.language;
    if (lang && SUPPORTED_LOCALES.has(lang as Locale)) {
      return lang as Locale;
    }
  } catch (error) {
    console.warn("Failed to fetch stored language in middleware:", error);
  }

  return null;
}

// Define protected and public routes
const protectedRoutes = ["/app"];
const authRoutes = ["/signin", "/get-started"];

// Feature-to-route mapping for feature toggle enforcement
const FEATURE_ROUTES = getFeatureRoutes();

/**
 * Get family settings from API
 * This is called in middleware to check feature access
 * Uses the session cookie to authenticate the request
 */
async function getFamilySettingsForMiddleware(
  sessionCookie: string,
): Promise<{ enabledFeatures: string[] } | null> {
  try {
    // First, get the user to extract familyId
    const API_BASE_URL =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001";

    const meResponse = await fetch(`${API_BASE_URL}/v1/auth/me`, {
      headers: {
        Cookie: sessionCookie,
      },
      cache: "no-store", // Don't cache in middleware
    });

    if (!meResponse.ok) {
      return null;
    }

    const meData = await meResponse.json();
    const familyId = meData.user?.families?.[0]?.familyId;

    if (!familyId) {
      return null;
    }

    // Fetch family settings
    const settingsResponse = await fetch(
      `${API_BASE_URL}/v1/families/${familyId}/settings`,
      {
        headers: {
          Cookie: sessionCookie,
        },
        cache: "no-store", // Don't cache in middleware
      },
    );

    if (!settingsResponse.ok) {
      // If settings fetch fails, fail open (allow all features)
      return null;
    }

    const settings = await settingsResponse.json();
    return settings;
  } catch (error) {
    // On error, fail open (allow all features)
    console.warn("Failed to fetch settings in middleware:", error);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const storedLanguagePromise = getStoredLanguageFromSession(request);

  if (
    PUBLIC_FILE.test(pathname) ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next")
  ) {
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = i18n.locales.every((locale) => {
    return !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`;
  });

  if (pathnameIsMissingLocale) {
    const storedLanguage = await storedLanguagePromise;
    const locale = storedLanguage ?? getLocale(request);
    const redirectURL = new URL(
      pathname === "/" ? `/${locale}` : `/${locale}${pathname}`,
      request.url,
    );
    return NextResponse.redirect(redirectURL);
  }

  // Authentication logic
  // Extract locale from pathname (e.g., /en-US/signin -> en-US)
  const localeMatch = pathname.match(/^\/([a-z]{2}-[A-Z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : null;

  // If user preference exists and differs from path locale, redirect to preferred locale
  const storedLanguage = await storedLanguagePromise;
  if (
    storedLanguage &&
    locale &&
    storedLanguage !== locale &&
    SUPPORTED_LOCALES.has(storedLanguage)
  ) {
    const redirectURL = new URL(
      `/${storedLanguage}${pathname.replace(`/${locale}`, "") || ""}`,
      request.url,
    );
    redirectURL.search = request.nextUrl.search;
    return NextResponse.redirect(redirectURL);
  }

  // Get the path without locale prefix
  const pathWithoutLocale = locale
    ? pathname.replace(`/${locale}`, "") || "/"
    : pathname;

  // Check if the current route is protected or an auth route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathWithoutLocale.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) =>
    pathWithoutLocale.startsWith(route),
  );

  // Check for session cookie (Better Auth sets this cookie)
  // When useSecureCookies is enabled, better-auth adds the __Secure- prefix
  // HTTPS: __Secure-better-auth.session_token
  // HTTP: better-auth.session_token
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");
  const isAuthenticated = !!sessionCookie;

  // Redirect to signin if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const signinUrl = new URL(
      locale ? `/${locale}/signin` : "/signin",
      request.url,
    );
    return NextResponse.redirect(signinUrl);
  }

  // Redirect to app if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    const appUrl = new URL(locale ? `/${locale}/app` : "/app", request.url);
    return NextResponse.redirect(appUrl);
  }

  // Feature access control - check if accessing a feature route
  if (isProtectedRoute && isAuthenticated && sessionCookie) {
    // Check if this path matches any feature route
    const featureKey = Object.keys(FEATURE_ROUTES).find((key) =>
      pathWithoutLocale.startsWith(FEATURE_ROUTES[key]),
    );

    if (featureKey) {
      // Fetch settings to check if feature is enabled
      const cookieString = `${sessionCookie.name}=${sessionCookie.value}`;
      const settings = await getFamilySettingsForMiddleware(cookieString);

      // If settings exist and feature is not enabled, redirect to dashboard
      if (settings && !settings.enabledFeatures.includes(featureKey)) {
        const dashboardUrl = new URL(
          locale ? `/${locale}/app` : "/app",
          request.url,
        );
        return NextResponse.redirect(dashboardUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|assets|.*\\..*).*)",
  ],
};
