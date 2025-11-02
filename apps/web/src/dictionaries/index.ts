import "server-only";

import type { Locale } from "@/i18n/config";
import { i18n } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";

const dictionaries: Record<Locale, () => Promise<Dictionary>> = {
  "en-US": () => import("./en-US.json").then((module) => module.default),
  "nl-NL": () => import("./nl-NL.json").then((module) => module.default),
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  // Lazy-load the requested locale dictionary on the server only.
  const normalized = i18n.locales.includes(locale)
    ? locale
    : (i18n.defaultLocale as Locale);
  return dictionaries[normalized]();
}
