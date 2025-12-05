import { cookies } from "next/headers";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { RecipesView } from "@/components/recipes/recipes-view";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getFamilies } from "@/lib/api-client";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function RecipesPage({ params }: PageProps) {
  const { lang: rawLang } = await params;
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

  // If no family, show a message to create one
  if (!family) {
    return (
      <DashboardLayout
        dict={dict}
        lang={lang}
        title={dict.dashboard.pages.recipes.title}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            {dict.dashboard.pages.recipes.title}
          </h1>
          <p className="text-muted-foreground">
            {dict.dashboard.pages.recipes.emptyState.description}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.recipes.title}
    >
      <RecipesView dict={dict} familyId={family.familyId} locale={lang} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
