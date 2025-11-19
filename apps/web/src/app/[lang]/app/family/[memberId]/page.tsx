import { MemberDetailView } from "@/components/family/member-detail-view";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ lang: string; memberId: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { lang: rawLang, memberId } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.memberDetail.title}
    >
      <MemberDetailView memberId={memberId} dict={dict.dashboard} lang={lang} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
