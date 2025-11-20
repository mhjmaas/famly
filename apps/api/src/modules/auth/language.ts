const SUPPORTED_LANGUAGES = ["en-US", "nl-NL"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function isSupportedLanguage(
  value: unknown,
): value is SupportedLanguage {
  return (
    typeof value === "string" &&
    SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
  );
}

/**
 * Resolve the preferred language from request input.
 *
 * Priority:
 * 1) Explicit body value (validated)
 * 2) Accept-Language header first match of supported locales
 * 3) Default fallback ("en-US")
 */
export function resolvePreferredLanguage(
  bodyLanguage?: unknown,
  acceptLanguageHeader?: string | null,
): SupportedLanguage {
  if (isSupportedLanguage(bodyLanguage)) {
    return bodyLanguage;
  }

  if (acceptLanguageHeader) {
    const candidates = acceptLanguageHeader
      .split(",")
      .map((part) => part.split(";")[0]?.trim())
      .filter(Boolean);

    const matched = candidates.find((lang) => isSupportedLanguage(lang));
    if (matched) {
      return matched as SupportedLanguage;
    }
  }

  return "en-US";
}

export { SUPPORTED_LANGUAGES };
