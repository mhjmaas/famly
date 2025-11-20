import { LanguageSelector } from "@/components/language-selector";
import { NotificationSwitch } from "@/components/notification-switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardHeader } from "@/components/ui/card";
import { usePersistLanguage } from "@/hooks/use-persist-language";
import type { Locale } from "@/i18n/config";

interface PreferencesCardProps {
  lang: Locale;
  dict: {
    title: string;
    subtitle: string;
    language: string;
    languageDescription: string;
    theme: string;
    themeDescription: string;
    notifications: string;
    notificationsDescription: string;
  };
}

export function PreferencesCard({ lang, dict }: PreferencesCardProps) {
  const persistLanguage = usePersistLanguage();

  return (
    <Card data-testid="preferences-card">
      <CardHeader>
        <h3 className="text-lg font-semibold" data-testid="preferences-title">
          {dict.title}
        </h3>
        <p
          className="text-sm text-muted-foreground"
          data-testid="preferences-subtitle"
        >
          {dict.subtitle}
        </p>
      </CardHeader>
      <div className="px-6 pb-6 space-y-4">
        <div
          className="flex items-center justify-between"
          data-testid="preference-language"
        >
          <div>
            <p className="font-medium">{dict.language}</p>
            <p className="text-sm text-muted-foreground">
              {dict.languageDescription}
            </p>
          </div>
          <LanguageSelector
            lang={lang}
            ariaLabel={dict.language}
            onLocaleChange={persistLanguage}
          />
        </div>
        <div
          className="flex items-center justify-between"
          data-testid="preference-theme"
        >
          <div>
            <p className="font-medium">{dict.theme}</p>
            <p className="text-sm text-muted-foreground">
              {dict.themeDescription}
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div
          className="flex items-center justify-between"
          data-testid="preference-notifications"
        >
          <div>
            <p className="font-medium">{dict.notifications}</p>
            <p className="text-sm text-muted-foreground">
              {dict.notificationsDescription}
            </p>
          </div>
          <NotificationSwitch />
        </div>
      </div>
    </Card>
  );
}
