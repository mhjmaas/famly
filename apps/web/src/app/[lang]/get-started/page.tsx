import { GetStartedFlow } from "@/components/auth/get-started-flow";
import { Footer } from "@/components/landing/footer";
import { Navigation } from "@/components/landing/navigation";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

interface GetStartedPageProps {
  params: Promise<{ lang: string }>;
}

export default async function GetStartedPage({ params }: GetStartedPageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation dict={dict.navigation} lang={lang} />
      <main className="flex-1 flex items-center justify-center px-4 py-12 pt-20 md:pt-24">
        <GetStartedFlow
          locale={lang}
          dict={dict.auth.getStarted}
          commonDict={dict.auth.common}
        />
      </main>
      <Footer
        dict={dict.footer}
        lang={lang}
        languageDict={dict.languageSelector}
      />
    </div>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
