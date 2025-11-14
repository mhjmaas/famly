import { GetStartedFlow } from "@/components/auth/get-started-flow";
import { Footer } from "@/components/landing/footer";
import { Navigation } from "@/components/landing/navigation";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getDeploymentStatus } from "@/lib/utils/status-utils";

interface GetStartedPageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GetStartedPage({
  params,
  searchParams,
}: GetStartedPageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);
  const resolvedSearchParams = (await searchParams) ?? {};
  const stepParam = resolvedSearchParams.step;
  const initialStep = Array.isArray(stepParam) ? stepParam[0] : stepParam;

  // Check deployment mode
  const status = await getDeploymentStatus();
  const isStandalone = status.mode === "standalone";

  // In standalone mode, skip the "choose" step and go directly to register
  const normalizedInitialStep =
    initialStep === "register" || initialStep === "family"
      ? (initialStep as "register" | "family")
      : isStandalone
        ? "register"
        : "choose";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation
        dict={dict.navigation}
        lang={lang}
        isStandalone={isStandalone}
      />
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-20 md:pt-24">
        <GetStartedFlow
          locale={lang}
          dict={dict.auth.getStarted}
          commonDict={dict.auth.common}
          initialStep={normalizedInitialStep}
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
