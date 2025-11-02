import type { ReactElement } from "react";
import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Privacy } from "@/components/landing/privacy";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<ReactElement> {
  const { lang: rawLang } = await params;
  const lang = isLocale(rawLang) ? rawLang : (i18n.defaultLocale as Locale);
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen">
      <Navigation dict={dict.navigation} lang={lang} />
      <main>
        <Hero dict={dict.hero} />
        <Features dict={dict.features} />
        <Privacy dict={dict.privacy} />
        <Pricing dict={dict.pricing} />
      </main>
      <Footer dict={dict.footer} lang={lang} languageDict={dict.languageSelector} />
    </div>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
