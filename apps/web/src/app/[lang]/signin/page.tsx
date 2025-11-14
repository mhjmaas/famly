import { SignInForm } from "@/components/auth/signin-form";
import { Footer } from "@/components/landing/footer";
import { Navigation } from "@/components/landing/navigation";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getDeploymentStatus } from "@/lib/utils/status-utils";

interface SignInPageProps {
  params: Promise<{ lang: string }>;
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Get deployment status for UI adaptation
  const status = await getDeploymentStatus();
  const isStandalone = status.mode === "standalone";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation
        dict={dict.navigation}
        lang={lang}
        isStandalone={isStandalone}
      />
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-20 md:pt-24">
        <SignInForm
          locale={lang}
          dict={dict.auth.signIn}
          commonDict={dict.auth.common}
        />
      </main>
      <Footer
        dict={dict.footer}
        lang={lang}
        languageDict={dict.languageSelector}
        isStandalone={isStandalone}
      />
    </div>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
