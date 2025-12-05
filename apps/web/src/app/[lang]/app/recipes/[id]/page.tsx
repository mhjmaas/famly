import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RecipeDetailView } from "@/components/recipes/recipe-detail-view";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getFamilies } from "@/lib/api-client";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string; id: string }>;
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { lang: rawLang, id: recipeId } = await params;
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  // Get auth info
  const cookieStore = await cookies();
  const cookieString = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  // Get family data
  const families = await getFamilies(cookieString);
  const family = families[0];

  // If no family, redirect to recipes page
  if (!family) {
    redirect(`/${lang}/app/recipes`);
  }

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.recipes.title}
    >
      <RecipeDetailView
        recipeId={recipeId}
        familyId={family.familyId}
        locale={lang}
        dict={dict}
        familyMembers={family.members.map((m) => ({
          id: m.memberId,
          name: m.name || "Unknown",
        }))}
      />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
