import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RewardsView } from "@/components/rewards/rewards-view";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getFamilies, getKarmaBalance, getMe } from "@/lib/api-client";
import type { MeResponse } from "@/types/api.types";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function RewardsPage({ params }: PageProps) {
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
  const family = families[0];

  // If no family, show a message to create one
  if (!family) {
    return (
      <DashboardLayout
        dict={dict}
        lang={lang}
        title={dict.dashboard.pages.rewards.title}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            {dict.dashboard.pages.rewards.title}
          </h1>
          <p className="text-muted-foreground">
            You need to create or join a family first.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // Get user's karma balance
  const karmaBalance = await getKarmaBalance(
    family.familyId,
    user.user.id,
    cookieString,
  );

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.rewards.title}
    >
      <RewardsView
        dict={dict}
        familyId={family.familyId}
        userId={user.user.id}
        userRole={family.role.toLowerCase() as "parent" | "child"}
        userKarma={karmaBalance.totalKarma}
      />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
