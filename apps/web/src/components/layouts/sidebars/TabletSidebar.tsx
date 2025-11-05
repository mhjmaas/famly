"use client"

import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LogoComponent } from "@/components/navigation/LogoComponent"
import { UserProfileDisplay } from "@/components/profile/UserProfileDisplay"
import { cn } from "@/lib/utils"
import type { NavigationSection, Dictionary, NavigationItem as NavigationItemType, UserProfileData } from "@/types/dashboard-layout.types"

interface TabletSidebarProps {
  navigationSections: NavigationSection[]
  pathname: string
  dict: Dictionary
  userProfile: UserProfileData
}

export function TabletSidebar({
  navigationSections,
  pathname,
  dict,
  userProfile,
}: TabletSidebarProps) {
  const allItems = navigationSections.flatMap((section) => {
    if (section.type === "single") {
      return [section as NavigationItemType]
    }
    return section.items || []
  })

  return (
    <div className="flex flex-col h-full" data-testid="tablet-nav-content">
      {/* Logo - Icon only, no text */}
      <div className="p-4 border-b border-border flex justify-center">
        <LogoComponent showText={false} testId="tablet-logo" />
      </div>

      {/* Navigation - Icons Only */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1" data-testid="tablet-navigation">
          {allItems.map((item) => {
            const itemHref = item.href
            const isActive = itemHref === pathname
            const isDisabled = item.disabled

            return (
              <Link
                key={item.name}
                href={isDisabled ? "#" : itemHref}
                className={cn(
                  "flex items-center justify-center p-3 rounded-lg transition-colors relative group",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDisabled
                      ? "text-muted-foreground/50 cursor-not-allowed"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
                title={dict.dashboard.navigation[item.name]}
              >
                <item.icon className="h-5 w-5" />
                {isDisabled && <span className="absolute -top-1 -right-1 w-2 h-2 bg-muted rounded-full" />}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info - Icon Only with Karma */}
      <div className="p-3 border-t border-border" data-testid="tablet-user-profile">
        <UserProfileDisplay
          profile={userProfile}
          variant="icon"
          testIdPrefix="tablet-user"
        />
      </div>
    </div>
  )
}
