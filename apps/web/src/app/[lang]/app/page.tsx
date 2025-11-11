import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
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
      <DashboardOverview lang={lang} dict={dict} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
