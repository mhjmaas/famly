"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import type { DictionarySection } from "@/i18n/types";

type NavigationProps = {
  dict: DictionarySection<"navigation">;
  lang: Locale;
};

/**
 * Navigation component for the landing page
 * Features a fixed header that changes appearance on scroll
 */
export function Navigation({ dict, lang }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      data-testid="navigation"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link
            href={`/${lang}`}
            data-testid="nav-logo"
            className="flex items-center gap-2 group"
          >
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80 transition-transform group-hover:scale-110" />
              <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80 transition-transform group-hover:scale-110" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              {dict.logo}
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#features"
              data-testid="nav-features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              scroll={true}
            >
              {dict.links.features}
            </Link>
            <Link
              href="#privacy"
              data-testid="nav-privacy"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              scroll={true}
            >
              {dict.links.privacy}
            </Link>
            <Link
              href="#pricing"
              data-testid="nav-pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              scroll={true}
            >
              {dict.links.pricing}
            </Link>
            <Link
              href={`/${lang}/docs`}
              data-testid="nav-docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.links.docs}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/${lang}/signin`} data-testid="nav-signin">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                {dict.buttons.signIn}
              </Button>
            </Link>
            <Link href={`/${lang}/get-started`} data-testid="nav-get-started">
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {dict.buttons.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
