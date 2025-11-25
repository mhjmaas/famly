import type { Metadata } from "next";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { RealtimeProvider } from "@/components/realtime-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { DeploymentProvider } from "@/contexts/deployment-context";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import {
  getChatsForCurrentUser,
  getFamiliesForCurrentUser,
  getUserWithKarmaAndSettings,
} from "@/lib/dal";
import { getSessionCookie } from "@/lib/server-cookies";
import { getDeploymentStatus } from "@/lib/utils/status-utils";
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

  // Fetch deployment status once at the root level
  // This will be cached by React and reused across all components
  const deploymentStatus = await getDeploymentStatus();

  // Load initial Redux state server-side using Data Access Layer
  let preloadedState: Partial<RootState> | undefined;

  const sessionCookie = await getSessionCookie();

  // Only try to fetch user data if we have a session cookie
  if (sessionCookie) {
    try {
      // Use DAL to fetch user, karma, and settings data
      // The DAL handles caching, cookie forwarding, and error handling
      const [{ user, karma, settings }, chats, families] = await Promise.all([
        getUserWithKarmaAndSettings(lang),
        getChatsForCurrentUser(lang).catch((error) => {
          console.warn("Failed to preload chats:", error);
          return [];
        }),
        getFamiliesForCurrentUser(lang).catch((error) => {
          console.warn("Failed to preload families:", error);
          return [];
        }),
      ]);

      // Get the first family ID for settings
      const familyId = user.families?.[0]?.familyId;

      // Enrich DM chat titles with the other member's name (viewer-dependent)
      // This must be done server-side because the title changes based on who's viewing
      const enrichedChats = chats.map((chat) => {
        // Only enrich DM chats that don't have an explicit title
        if (
          chat.type !== "dm" ||
          (chat.title && chat.title.trim().length > 0)
        ) {
          return chat;
        }

        // Find the other member in the DM (not the current user)
        const otherMemberId = chat.memberIds.find(
          (id: string) => id !== user.id,
        );
        if (!otherMemberId) {
          return chat;
        }

        // Look up the member's name from families
        const member = families
          .flatMap((f) => f.members)
          .find((m) => m.memberId === otherMemberId);

        // Enrich the chat with the member's name
        if (member?.name) {
          return {
            ...chat,
            title: member.name,
          };
        }

        return chat;
      });

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
        settings: {
          settingsByFamily:
            familyId && settings
              ? {
                  [familyId]: settings,
                }
              : {},
          isLoading: false,
          error: null,
        },
        chat: {
          chats: enrichedChats,
          messages: {},
          activeChatId: null,
          loading: {
            chats: false,
            messages: false,
            sending: false,
          },
          error: {
            chats: null,
            messages: null,
            sending: null,
          },
          lastFetch: Date.now(),
        },
        family: {
          families,
          currentFamily: families[0] || null,
          isLoading: false,
          error: null,
          operations: {
            updateRole: { isLoading: false, error: null },
            removeMember: { isLoading: false, error: null },
            grantKarma: { isLoading: false, error: null },
            addMember: { isLoading: false, error: null },
          },
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
        <DeploymentProvider status={deploymentStatus}>
          <StoreProvider preloadedState={preloadedState}>
            <ThemeProvider defaultTheme="system" storageKey="famly-theme">
              <RealtimeProvider>
                {children}
                <Toaster />
              </RealtimeProvider>
            </ThemeProvider>
          </StoreProvider>
        </DeploymentProvider>
      </body>
    </html>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
