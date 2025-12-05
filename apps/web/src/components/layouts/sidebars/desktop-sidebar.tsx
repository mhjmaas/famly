"use client";

import { LogoComponent } from "@/components/navigation/logo-component";
import { NavigationItem } from "@/components/navigation/navigation-item";
import { SectionNavigation } from "@/components/navigation/section-navigation";
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  Dictionary,
  NavigationSection,
  UserProfileData,
} from "@/types/dashboard-layout.types";

interface DesktopSidebarProps {
  navigationSections: NavigationSection[];
  expandedSections: string[];
  pathWithoutLocale: string;
  dict: Dictionary;
  userProfile: UserProfileData;
  onToggleSection: (sectionName: string) => void;
  navScrollRef?: React.Ref<HTMLDivElement>;
}

export function DesktopSidebar({
  navigationSections,
  expandedSections,
  pathWithoutLocale,
  dict,
  userProfile,
  onToggleSection,
  navScrollRef,
}: DesktopSidebarProps) {
  return (
    <div className="flex flex-col h-full" data-testid="desktop-nav-content">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <LogoComponent href="/" testId="desktop-logo" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea ref={navScrollRef} className="h-full px-3 py-4">
          <nav className="space-y-1" data-testid="desktop-navigation">
            {navigationSections.map((section) => {
              if (section.type === "single") {
                return (
                  <NavigationItem
                    key={section.name}
                    item={section}
                    isSingleItem
                    isActive={section.href === pathWithoutLocale}
                    dict={dict}
                  />
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
                />
              );
            })}
          </nav>
        </ScrollArea>
      </div>

      {/* User Info */}
      <div
        className="p-4 border-t border-border"
        data-testid="desktop-user-profile"
      >
        <UserProfileDisplay
          profile={userProfile}
          variant="full"
          testIdPrefix="user"
        />
      </div>
    </div>
  );
}
