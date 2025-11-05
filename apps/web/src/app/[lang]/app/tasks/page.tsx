import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { TasksView } from "@/components/tasks/TasksView";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getFamilies, getMe } from "@/lib/api-client";
import type { MeResponse } from "@/types/api.types";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function TasksPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Get auth info
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  let user: MeResponse;
  try {
    user = await getMe(cookieString);
  } catch {
    redirect(`/${lang}/signin`);
  }

  // Get family data
  const families = await getFamilies(cookieString);
  if (families.length === 0) {
    redirect(`/${lang}/get-started`);
  }

  const family = families[0];

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.tasks.title}
    >
      <TasksView
        dict={dict}
        familyId={family.familyId}
        userId={user.user.id}
        userRole={family.role.toLowerCase() as "parent" | "child"}
        familyMembers={family.members.map((m) => ({
          id: m.memberId,
          name: m.name || "Unknown",
          role: m.role.toLowerCase() as "parent" | "child",
        }))}
      />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
