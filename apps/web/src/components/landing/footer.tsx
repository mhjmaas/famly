import { Github, Heart, Mail, Twitter } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/config";
import type { DictionarySection } from "@/i18n/types";

type FooterProps = {
  dict: DictionarySection<"footer">;
  lang: Locale;
  languageDict: DictionarySection<"languageSelector">;
  isStandalone?: boolean;
};

const productLinks = ["features", "pricing", "roadmap", "changelog"] as const;
const resourceLinks = [
  "documentation",
  "selfHostingGuide",
  "apiReference",
  "community",
] as const;
const companyLinks = [
  "about",
  "blog",
  "privacyPolicy",
  "termsOfService",
] as const;

/**
 * Footer component for the landing page
 * Contains navigation links, social links, and theme toggle
 *
 * In standalone mode: Shows only bottom bar (copyright, theme toggle, language selector)
 * In SaaS mode: Shows full footer with product, resources, and company links
 */
export function Footer({
  dict,
  lang,
  languageDict,
  isStandalone = false,
}: FooterProps) {
  const currentYear = new Date().getFullYear();
  const copyright = `${dict.bottom.prefix.replace("{year}", currentYear.toString())} `;

  return (
    <footer
      data-testid="footer-section"
      className="border-t border-border bg-muted/30"
    >
      <div
        className={`container mx-auto px-4 sm:px-6 lg:px-8 ${isStandalone ? "py-6" : "py-12 md:py-16"}`}
      >
        {/* Full footer - Only show in SaaS mode */}
        {!isStandalone && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <Link href={`/${lang}`} className="flex items-center gap-2 group">
                <Heart className="h-6 w-6 text-primary fill-primary" />
                <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                  {dict.brandName}
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dict.tagline}
              </p>
              <div className="flex items-center gap-3">
                <a
                  href="https://github.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a
                  href="https://twitter.com"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href="mailto:hello@famly.app"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">
                {dict.sections.product.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {productLinks.map((key) => (
                  <li key={key}>
                    <Link
                      href={
                        key === "features"
                          ? `/${lang}#features`
                          : key === "pricing"
                            ? `/${lang}#pricing`
                            : `/${lang}/${key === "roadmap" ? "roadmap" : "changelog"}`
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {dict.sections.product.links[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-4">
                {dict.sections.resources.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {resourceLinks.map((key) => (
                  <li key={key}>
                    <Link
                      href={`/${lang}/${
                        key === "documentation"
                          ? "docs"
                          : key === "selfHostingGuide"
                            ? "guides"
                            : key === "apiReference"
                              ? "api"
                              : "community"
                      }`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {dict.sections.resources.links[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">
                {dict.sections.company.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {companyLinks.map((key) => (
                  <li key={key}>
                    <Link
                      href={`/${lang}/${key === "termsOfService" ? "terms" : key === "privacyPolicy" ? "privacy" : key}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {dict.sections.company.links[key]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Bottom Bar - Always visible */}
        <div
          className={`${!isStandalone ? "pt-8 border-t border-border" : ""} flex flex-col sm:flex-row items-center justify-between gap-4`}
        >
          <p className="text-sm text-muted-foreground">
            {copyright}
            <Heart className="inline h-3 w-3 text-primary fill-primary" />{" "}
            {dict.bottom.suffix}
          </p>
          <ThemeToggle />
          <Suspense fallback={null}>
            <LanguageSelector lang={lang} ariaLabel={languageDict.ariaLabel} />
          </Suspense>
        </div>
      </div>
    </footer>
  );
}
