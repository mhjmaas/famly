import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getMe } from "@/lib/api-client";
import { DiaryPageClient } from "./diary-page-client";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function DiaryPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Get auth info
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    await getMe(cookieString);
  } catch {
    redirect(`/${lang}/signin`);
  }

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.diary.title}
    >
      <DiaryPageClient dict={dict.dashboard.pages.diary} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
