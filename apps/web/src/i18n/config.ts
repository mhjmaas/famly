export const i18n = {
  locales: ["en-US", "nl-NL"] as const,
  defaultLocale: "en-US",
};

export type Locale = (typeof i18n.locales)[number];

export const localeLabels: Record<Locale, { short: string; name: string }> = {
  "en-US": { short: "EN", name: "English" },
  "nl-NL": { short: "NL", name: "Nederlands" },
};
