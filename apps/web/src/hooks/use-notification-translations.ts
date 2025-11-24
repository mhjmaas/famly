"use client";

import { useMemo } from "react";
import enUSDict from "@/dictionaries/en-US/notifications.json";
import nlNLDict from "@/dictionaries/nl-NL/notifications.json";
import type { Locale } from "@/i18n/config";
import { i18n } from "@/i18n/config";
import { useAppSelector } from "@/store/hooks";
import { selectUser } from "@/store/slices/user.slice";

const notificationDictionaries: Record<Locale, typeof enUSDict> = {
  "en-US": enUSDict,
  "nl-NL": nlNLDict,
};

/**
 * Hook to get notification translations based on user's language preference
 * Returns translation strings for toast notifications
 */
export function useNotificationTranslations() {
  const user = useAppSelector(selectUser);

  const locale = useMemo(() => {
    const userLocale = user?.language as Locale | undefined;
    // Validate locale is supported, fall back to default
    return userLocale && i18n.locales.includes(userLocale)
      ? userLocale
      : (i18n.defaultLocale as Locale);
  }, [user?.language]);

  return notificationDictionaries[locale].notifications;
}
