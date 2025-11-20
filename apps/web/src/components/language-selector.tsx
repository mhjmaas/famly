"use client";

import { Globe } from "lucide-react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { i18n, type Locale, localeLabels } from "@/i18n/config";

type LanguageSelectorProps = {
  lang: Locale;
  ariaLabel: string;
  onLocaleChange?: (locale: Locale) => Promise<void> | void;
};

export function LanguageSelector({
  lang,
  ariaLabel,
  onLocaleChange,
}: LanguageSelectorProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentLocale = useMemo(() => {
    const paramLocale =
      typeof params?.lang === "string" ? (params.lang as Locale) : undefined;
    return (i18n.locales.find((locale) => locale === paramLocale) ??
      lang) as Locale;
  }, [lang, params]);

  const handleLocaleChange = useCallback(
    async (newLocale: Locale) => {
      if (newLocale === currentLocale) {
        return;
      }

      // Persist preference if provided (best-effort)
      if (onLocaleChange) {
        try {
          await onLocaleChange(newLocale);
        } catch {
          // Ignore persistence errors; still change route
        }
      }

      const segments = pathname?.split("/").filter(Boolean) ?? [];
      if (segments.length === 0) {
        const query = searchParams?.toString();
        const target = `/${newLocale}${query ? `?${query}` : ""}`;
        router.push(target);
        return;
      }

      segments[0] = newLocale;
      const newPathname = `/${segments.join("/")}`;
      const query = searchParams?.toString();
      router.push(query ? `${newPathname}?${query}` : newPathname);
    },
    [currentLocale, pathname, router, searchParams, onLocaleChange],
  );

  return (
    <nav
      aria-label={ariaLabel}
      className="flex items-center gap-1 rounded-lg bg-muted p-1"
    >
      {i18n.locales.map((locale) => {
        const labels = localeLabels[locale];
        const isActive = locale === currentLocale;

        return (
          <Button
            key={locale}
            variant="ghost"
            size="sm"
            onClick={() => handleLocaleChange(locale)}
            className={`gap-2 ${isActive ? "bg-background shadow-sm" : "hover:bg-background/50"}`}
            aria-pressed={isActive}
            aria-current={isActive ? "true" : undefined}
            title={labels.name}
            aria-label={labels.name}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{labels.short}</span>
          </Button>
        );
      })}
    </nav>
  );
}
