import { ChatInterface } from "@/components/chat/chat-interface";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { getDictionary } from "@/dictionaries";
import { i18n, type Locale } from "@/i18n/config";

// Force dynamic rendering since we need real-time data
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ lang: string }>;
  searchParams?: Promise<{ chatId?: string }>;
}

export default async function ChatPage({ params, searchParams }: PageProps) {
  const { lang: rawLang } = await params;
  const { chatId } = (await searchParams) ?? {};
  const lang = (isLocale(rawLang) ? rawLang : i18n.defaultLocale) as Locale;
  const dict = await getDictionary(lang);

  return (
    <DashboardLayout
      dict={dict}
      lang={lang}
      title={dict.dashboard.pages.chat.title}
    >
      <ChatInterface dict={dict.dashboard.pages.chat} initialChatId={chatId} />
    </DashboardLayout>
  );
}

function isLocale(input: string): input is Locale {
  return (i18n.locales as readonly string[]).includes(input);
}
