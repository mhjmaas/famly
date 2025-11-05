import { DashboardLayout } from "@/components/layouts/dashboard-layout";
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
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.dashboard.title}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">
          {dict.dashboard.pages.dashboard.title}
        </h1>
        <p className="text-muted-foreground">
          {dict.dashboard.pages.dashboard.placeholder}
        </p>
      </div>
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
