import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
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
  const locale = match(languages, i18n.locales, i18n.defaultLocale);
  return (i18n.locales.includes(locale as Locale) ? locale : i18n.defaultLocale) as Locale;
}

export function middleware(request: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|assets|.*\\..*).*)",
  ],
};
