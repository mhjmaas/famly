"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LogoComponent } from "@/components/navigation/LogoComponent";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils/style-utils";
import type { DashboardLayoutProps } from "@/types/dashboard-layout.types";
import { DesktopSidebar } from "./sidebars/DesktopSidebar";
import { MobileSidebar } from "./sidebars/MobileSidebar";
import { TabletSidebar } from "./sidebars/TabletSidebar";

export type { Dictionary } from "@/types/dashboard-layout.types";

const DEFAULT_EXPANDED_SECTIONS: readonly string[] = ["family", "personal"];
const EXPANDED_SECTIONS_STORAGE_KEY = "dashboard-nav-expanded";
const SCROLL_POSITION_STORAGE_KEY = "dashboard-nav-scroll";

function getInitialExpandedSections(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_EXPANDED_SECTIONS];
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      EXPANDED_SECTIONS_STORAGE_KEY,
    );

    if (!storedValue) {
      return [...DEFAULT_EXPANDED_SECTIONS];
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [...DEFAULT_EXPANDED_SECTIONS];
    }

    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch (error) {
    console.warn("Failed to read dashboard navigation state:", error);
    return [...DEFAULT_EXPANDED_SECTIONS];
  }
}

function sanitizeExpandedSections(
  sections: string[],
  validSectionNames: string[],
): string[] {
  const deduped: string[] = [];

  sections.forEach((section) => {
    if (!validSectionNames.includes(section)) {
      return;
    }

    if (deduped.includes(section)) {
      return;
    }

    deduped.push(section);
  });

  if (deduped.length > 0) {
    return deduped;
  }

  const fallback = DEFAULT_EXPANDED_SECTIONS.filter((section) =>
    validSectionNames.includes(section),
  );

  if (fallback.length > 0) {
    return [...fallback];
  }

  return [...validSectionNames];
}

function arraysAreEqual(first: readonly string[], second: readonly string[]) {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value, index) => value === second[index]);
}

export function DashboardLayout({
  children,
  className,
  mobileActions,
  title,
  dict,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const pathWithoutLocale = useMemo(
    () => pathname.replace(/^\/(en-US|nl-NL)/, ""),
    [pathname],
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  // Get navigation and user data from hooks
  const { navigationSections, validSectionNames } = useDashboardNavigation();
  const userProfile = useUserProfile(dict);

  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    sanitizeExpandedSections(getInitialExpandedSections(), validSectionNames),
  );
  const desktopNavScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(
      EXPANDED_SECTIONS_STORAGE_KEY,
      JSON.stringify(expandedSections),
    );
  }, [expandedSections]);

  useEffect(() => {
    setExpandedSections((previous) => {
      const sanitized = sanitizeExpandedSections(previous, validSectionNames);
      return arraysAreEqual(previous, sanitized) ? previous : sanitized;
    });
  }, [validSectionNames]);

  useEffect(() => {
    const activeSection = navigationSections.find(
      (section) =>
        section.type === "section" &&
        section.items?.some((item) => item.href === pathWithoutLocale),
    );

    if (!activeSection) {
      return;
    }

    const sectionName = activeSection.name as string;

    setExpandedSections((previous) => {
      if (previous.includes(sectionName)) {
        return previous;
      }

      return [...previous, sectionName];
    });
  }, [navigationSections, pathWithoutLocale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const rootElement = desktopNavScrollRef.current;

    if (!rootElement) {
      return;
    }

    const viewport = rootElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );

    if (!viewport) {
      return;
    }

    const storedScrollTop = window.sessionStorage.getItem(
      SCROLL_POSITION_STORAGE_KEY,
    );

    if (storedScrollTop) {
      const parsed = Number.parseInt(storedScrollTop, 10);
      if (!Number.isNaN(parsed)) {
        viewport.scrollTop = parsed;
      }
    }

    const updateStoredScroll = () => {
      window.sessionStorage.setItem(
        SCROLL_POSITION_STORAGE_KEY,
        Math.round(viewport.scrollTop).toString(),
      );
    };

    updateStoredScroll();
    viewport.addEventListener("scroll", updateStoredScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", updateStoredScroll);
      updateStoredScroll();
    };
  }, []);

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((s) => s !== sectionName)
        : [...prev, sectionName],
    );
  };

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-layout">
      {/* Mobile Header - Only on small screens */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border"
        data-testid="mobile-header"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <LogoComponent testId="mobile-logo" />
            {title && (
              <>
                <span className="text-muted-foreground">•</span>
                <span
                  className="text-lg font-semibold"
                  data-testid="mobile-page-title"
                >
                  {title}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mobileActions}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="mobile-menu-button"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-72 h-full flex flex-col"
                data-testid="mobile-drawer"
              >
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <MobileSidebar
                  navigationSections={navigationSections}
                  expandedSections={expandedSections}
                  pathWithoutLocale={pathWithoutLocale}
                  dict={dict}
                  userProfile={userProfile}
                  onToggleSection={toggleSection}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Tablet Sidebar - Icons only, always visible on md to lg screens */}
      <aside
        className="hidden md:flex lg:hidden fixed inset-y-0 w-20 flex-col border-r border-border bg-card z-40"
        data-testid="tablet-sidebar"
      >
        <TabletSidebar
          navigationSections={navigationSections}
          pathname={pathname}
          dict={dict}
          userProfile={userProfile}
        />
      </aside>

      {/* Desktop Sidebar - Full width with text, always visible on lg+ screens */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-card z-40"
        data-testid="desktop-sidebar"
      >
        <DesktopSidebar
          navigationSections={navigationSections}
          expandedSections={expandedSections}
          pathWithoutLocale={pathWithoutLocale}
          dict={dict}
          userProfile={userProfile}
          onToggleSection={toggleSection}
          navScrollRef={desktopNavScrollRef}
        />
      </aside>

      {/* Main Content */}
      <main className="md:pl-20 lg:pl-72" data-testid="main-content">
        <div
          className={cn(className || "p-6", "!pt-20 md:!pt-6")}
          data-testid="page-content"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
