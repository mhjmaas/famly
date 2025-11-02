import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

interface AppPageProps {
  params: Promise<{ lang: string }>;
}

export default async function AppPage({ params }: AppPageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">
          {dict.app.placeholderHeading}
        </h1>
      </div>
    </div>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
