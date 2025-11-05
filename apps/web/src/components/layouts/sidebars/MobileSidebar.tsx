"use client";

import Link from "next/link";
import { LogoComponent } from "@/components/navigation/LogoComponent";
import { SectionNavigation } from "@/components/navigation/SectionNavigation";
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type {
  Dictionary,
  NavigationSection,
  UserProfileData,
} from "@/types/dashboard-layout.types";

interface MobileSidebarProps {
  navigationSections: NavigationSection[];
  expandedSections: string[];
  pathWithoutLocale: string;
  dict: Dictionary;
  userProfile: UserProfileData;
  onToggleSection: (sectionName: string) => void;
  onNavigate?: () => void;
}

export function MobileSidebar({
  navigationSections,
  expandedSections,
  pathWithoutLocale,
  dict,
  userProfile,
  onToggleSection,
  onNavigate,
}: MobileSidebarProps) {
  return (
    <div className="flex flex-col h-full" data-testid="mobile-nav-content">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <LogoComponent onClick={onNavigate} testId="mobile-drawer-logo" />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1" data-testid="mobile-navigation">
          {navigationSections.map((section) => {
            if (section.type === "single") {
              return (
                <Link
                  key={section.name}
                  href={section.href || "#"}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathWithoutLocale === section.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  data-testid={`nav-${section.name.replace(/([A-Z])/g, "-$1").toLowerCase()}`}
                >
                  <section.icon className="h-5 w-5" />
                  {dict.dashboard.navigation[section.name]}
                </Link>
              );
            }

            return (
              <SectionNavigation
                key={section.name}
                section={section}
                isExpanded={expandedSections.includes(section.name as string)}
                pathWithoutLocale={pathWithoutLocale}
                dict={dict}
                onToggleSection={onToggleSection}
                onNavigate={onNavigate}
              />
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div
        className="p-4 border-t border-border"
        data-testid="mobile-user-profile"
      >
        <UserProfileDisplay
          profile={userProfile}
          variant="full"
          onClick={onNavigate}
          testIdPrefix="mobile-user"
        />
      </div>
    </div>
  );
}
