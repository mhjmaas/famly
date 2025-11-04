import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ProfileView } from "@/components/profile/profile-view";
import { getUserActivityEvents } from "@/lib/dal";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Fetch activity events using DAL
  // The DAL handles authentication verification and error handling
  const activityEvents = await getUserActivityEvents();

  return (
    <DashboardLayout dict={dict} lang={lang} title={dict.profile.title}>
      <ProfileView
        lang={lang}
        initialEvents={activityEvents}
        dict={dict.profile}
      />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
