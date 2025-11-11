import type { Metadata } from "next";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getUserWithKarma } from "@/lib/dal";
import { StoreProvider } from "@/store/provider";
import type { RootState } from "@/store/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: rawLang } = await params;
  const locale = isLocale(rawLang) ? rawLang : (i18n.defaultLocale as Locale);
  const dict = await getDictionary(locale);

  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
    appleWebApp: {
      title: "Famly",
    },
    alternates: {
      languages: Object.fromEntries(
        i18n.locales.map((locale) => [locale, `/${locale}`]),
      ),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  // Next.js 16: params is a Promise and must be awaited in server components.
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : (i18n.defaultLocale as Locale);

  // Load initial Redux state server-side using Data Access Layer
  let preloadedState: Partial<RootState> | undefined;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("better-auth.session_token");

  // Only try to fetch user data if we have a session cookie
  if (sessionCookie) {
    try {
      // Use DAL to fetch user and karma data
      // The DAL handles caching, cookie forwarding, and error handling
      const { user, karma } = await getUserWithKarma(lang);

      // Preload Redux state
      preloadedState = {
        user: {
          profile: user,
          isLoading: false,
          error: null,
        },
        karma: {
          balances: {
            [user.id]: karma,
          },
          isLoading: false,
          error: null,
        },
      };
    } catch (error) {
      // Check if this is a Next.js redirect (not an actual error)
      if (isRedirectError(error)) {
        // Re-throw redirect errors so Next.js can handle them
        throw error;
      }

      // Log actual errors but continue rendering
      console.error("Failed to load initial state:", error);
      // Don't set preloadedState - render without user data
    }
  }

  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StoreProvider preloadedState={preloadedState}>
          <ThemeProvider defaultTheme="system" storageKey="famly-theme">
            {children}
            <Toaster />
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
