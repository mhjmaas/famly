import type { NotificationLocale } from "@locales/notifications";
import { notificationDictionaries } from "@locales/notifications";
import {
  isSupportedLanguage,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@modules/auth/language";

type NotificationsRoot =
  (typeof notificationDictionaries)[SupportedLanguage]["notifications"];

export type NotificationKey = Extract<
  keyof NotificationsRoot,
  | "karma"
  | "task"
  | "reward"
  | "family"
  | "activity"
  | "contributionGoal"
  | "chat"
>;

type FlattenedKeys<T> = {
  [K in keyof T]: T[K] extends string
    ? `${string & K}`
    : T[K] extends Record<string, unknown>
      ? `${string & K}.${FlattenedKeys<T[K]>}`
      : never;
}[keyof T];

export type NotificationStringKey = FlattenedKeys<NotificationsRoot>;

export const DEFAULT_NOTIFICATION_LOCALE: SupportedLanguage = "en-US";

function getTemplate(
  locale: NotificationLocale,
  key: NotificationStringKey,
): string | undefined {
  const dictionary = notificationDictionaries[locale].notifications;
  const path = key.split(".");
  let current: unknown = dictionary;

  for (const segment of path) {
    if (
      current &&
      typeof current === "object" &&
      segment in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(
  template: string,
  params: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

/**
 * Select a supported notification locale with fallback.
 */
export function resolveNotificationLocale(
  preferred?: string | null,
): SupportedLanguage {
  if (isSupportedLanguage(preferred)) {
    return preferred;
  }
  return DEFAULT_NOTIFICATION_LOCALE;
}

/**
 * Translate a notification string key with placeholder substitution.
 * Falls back to the default locale if a key is missing for the requested locale.
 */
export function translateNotification(
  locale: SupportedLanguage,
  key: NotificationStringKey,
  params: Record<string, string | number | undefined> = {},
): string {
  const template =
    getTemplate(locale, key) ?? getTemplate(DEFAULT_NOTIFICATION_LOCALE, key);

  if (!template) {
    // Should not happen; return key for debugging
    return key;
  }

  return interpolate(template, params);
}

/**
 * Convenience helper to ensure a locale is one of the notification dictionaries.
 */
export function isNotificationLocale(
  value: string,
): value is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}
