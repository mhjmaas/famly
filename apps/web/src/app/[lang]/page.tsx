import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navigation } from "@/components/landing/navigation";
import { Pricing } from "@/components/landing/pricing";
import { Privacy } from "@/components/landing/privacy";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { hasSessionCookie } from "@/lib/server-cookies";
import { getDeploymentStatus } from "@/lib/status-client";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<ReactElement> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : (i18n.defaultLocale as Locale);

  // Check deployment mode and redirect if needed
  const status = await getDeploymentStatus();

  if (status.mode === "standalone") {
    // In standalone mode, check onboarding status
    if (status.onboardingCompleted) {
      // Onboarding complete - check if user is authenticated
      const isAuthenticated = await hasSessionCookie();
      if (isAuthenticated) {
        // Authenticated user - redirect to app
        redirect(`/${lang}/app`);
      } else {
        // Unauthenticated user - redirect to signin
        redirect(`/${lang}/signin`);
      }
    } else {
      // Onboarding not complete - redirect to get-started
      redirect(`/${lang}/get-started`);
    }
  }

  // SaaS mode - show landing page normally
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen">
      <Navigation dict={dict.navigation} lang={lang} isStandalone={false} />
      <main>
        <Hero dict={dict.hero} />
        <Features dict={dict.features} />
        <Privacy dict={dict.privacy} />
        <Pricing dict={dict.pricing} />
      </main>
      <Footer
        dict={dict.footer}
        lang={lang}
        languageDict={dict.languageSelector}
        isStandalone={false}
      />
    </div>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
