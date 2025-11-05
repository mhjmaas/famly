"use client"

import { useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LogoComponent } from "@/components/navigation/LogoComponent"
import { NavigationItem } from "@/components/navigation/NavigationItem"
import { SectionNavigation } from "@/components/navigation/SectionNavigation"
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay"
import type { NavigationSection, Dictionary, UserProfileData } from "@/types/dashboard-layout.types"

interface DesktopSidebarProps {
  navigationSections: NavigationSection[]
  expandedSections: string[]
  pathWithoutLocale: string
  dict: Dictionary
  userProfile: UserProfileData
  onToggleSection: (sectionName: string) => void
  navScrollRef?: React.Ref<HTMLDivElement>
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
        <LogoComponent testId="desktop-logo" />
      </div>

      {/* Navigation */}
      <ScrollArea ref={navScrollRef} className="flex-1 px-3 py-4">
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
              )
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
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="p-4 border-t border-border" data-testid="desktop-user-profile">
        <UserProfileDisplay
          profile={userProfile}
          variant="full"
          testIdPrefix="user"
        />
      </div>
    </div>
  )
}
