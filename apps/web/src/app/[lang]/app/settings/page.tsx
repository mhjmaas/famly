import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { SettingsView } from "@/components/settings/settings-view";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getUser } from "@/lib/dal";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Verify user is authenticated and get their profile
  const user = await getUser(lang);

  // Check if user is a parent in at least one family
  const isParent = user.families?.some(
    (f: { role: string }) => f.role === "Parent",
  );
  if (!isParent) {
    // Redirect children to dashboard
    redirect(`/${lang}/app`);
  }

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.settings.title}
    >
      <SettingsView dict={dict.dashboard} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
