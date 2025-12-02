import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ShoppingListsView } from "@/components/shopping-lists";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";
import { getFamilies, getMe } from "@/lib/api-client";

// Force dynamic rendering since we use cookies
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function ShoppingListsPage({ params }: PageProps) {
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

  // Get family data
  const families = await getFamilies(cookieString);
  const family = families[0];

  // If no family, show a message to create one
  if (!family) {
    return (
      <DashboardLayout
        dict={dict}
        lang={lang}
        title={dict.dashboard.pages.shoppingLists.title}
      >
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-foreground">
            {dict.dashboard.pages.shoppingLists.title}
          </h1>
          <p className="text-muted-foreground">
            Please create a family first to use shopping lists.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.shoppingLists.title}
    >
      <ShoppingListsView dict={dict} familyId={family.familyId} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
