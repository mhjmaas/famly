import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18n, type Locale } from "@/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;

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

// Define protected and public routes
const protectedRoutes = ["/app"];
const authRoutes = ["/signin", "/get-started"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    const locale = getLocale(request);
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|assets|.*\\..*).*)",
  ],
};
