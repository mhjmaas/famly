import type { ActivityLocale } from "@locales/activity";
import { activityDictionaries } from "@locales/activity";
import type { SupportedLanguage } from "@modules/auth/language";
import { resolvePreferredLanguage } from "@modules/auth/language";

type ActivityRoot =
  (typeof activityDictionaries)[SupportedLanguage]["activity"];

type Flatten<T> = {
  [K in keyof T]: T[K] extends string
    ? `${string & K}`
    : T[K] extends Record<string, unknown>
      ? `${string & K}.${Flatten<T[K]>}`
      : never;
}[keyof T];

export type ActivityTemplateKey = Flatten<ActivityRoot>;

function getTemplate(
  locale: ActivityLocale,
  key: ActivityTemplateKey,
): string | undefined {
  const path = key.split(".");
  let current: unknown = activityDictionaries[locale].activity;
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

export function resolveActivityLocale(
  preferred?: string | null,
): ActivityLocale {
  const lang = resolvePreferredLanguage(preferred, undefined);
  return lang;
}

export function translateActivity(
  locale: ActivityLocale,
  key: ActivityTemplateKey,
  params: Record<string, string | number | undefined>,
): string {
  const template =
    getTemplate(locale, key) ??
    getTemplate(resolveActivityLocale("en-US"), key);
  if (!template) return key;
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const val = params[k];
    return val === undefined || val === null ? "" : String(val);
  });
}
