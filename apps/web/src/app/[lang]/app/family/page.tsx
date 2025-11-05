import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function FamilyPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.family.title}
    >
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-foreground">
          {dict.dashboard.pages.family.title}
        </h1>
        <p className="text-muted-foreground">
          {dict.dashboard.pages.family.placeholder}
        </p>
      </div>
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
