"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/user.slice"
import { selectKarmaBalance } from "@/store/slices/karma.slice"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  CheckSquare,
  Home,
  Menu,
  MessageSquare,
  Settings,
  Users,
  Sparkles,
  ShoppingCart,
  Gift,
  Calendar,
  MapPin,
  Camera,
  BookOpen,
  ChevronDown,
  Bot,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Locale } from "@/i18n/config"
import { formatTemplate } from "@/lib/format-template"

export type Dictionary = {
  dashboard: {
    navigation: {
      dashboard: string
      family: string
      members: string
      tasks: string
      shoppingLists: string
      rewards: string
      calendar: string
      locations: string
      memories: string
      aiSettings: string
      personal: string
      diary: string
      chat: string
      settings: string
      soon: string
      karma: string
    }
  }
  languageSelector?: {
    ariaLabel: string
  }
}

interface NavigationItem {
  name: keyof Dictionary["dashboard"]["navigation"]
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

interface NavigationSection {
  type: "single" | "section"
  name: keyof Dictionary["dashboard"]["navigation"]
  href?: string
  icon: React.ComponentType<{ className?: string }>
  items?: NavigationItem[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  mobileActions?: React.ReactNode
  title?: string
  dict: Dictionary
  lang: Locale
}

const createNavigationSections = (): NavigationSection[] => [
  {
    type: "single",
    name: "dashboard",
    href: "/app",
    icon: Home,
  },
  {
    type: "section",
    name: "family",
    icon: Users,
    items: [
      { name: "members", href: "/app/family", icon: Users },
      { name: "tasks", href: "/app/tasks", icon: CheckSquare },
      { name: "shoppingLists", href: "/app/shopping-lists", icon: ShoppingCart },
      { name: "rewards", href: "/app/rewards", icon: Gift },
      { name: "calendar", href: "/app/calendar", icon: Calendar, disabled: true },
      { name: "locations", href: "/app/locations", icon: MapPin },
      { name: "memories", href: "/app/memories", icon: Camera },
      { name: "aiSettings", href: "/app/ai-settings", icon: Bot },
    ],
  },
  {
    type: "section",
    name: "personal",
    icon: BookOpen,
    items: [
      { name: "diary", href: "/app/diary", icon: BookOpen },
      { name: "chat", href: "/app/chat", icon: MessageSquare },
      { name: "settings", href: "/app/profile", icon: Settings },
    ],
  },
]

const DEFAULT_EXPANDED_SECTIONS: readonly string[] = ["family", "personal"]
const EXPANDED_SECTIONS_STORAGE_KEY = "dashboard-nav-expanded"
const SCROLL_POSITION_STORAGE_KEY = "dashboard-nav-scroll"

function getInitialExpandedSections(): string[] {
  if (typeof window === "undefined") {
    return [...DEFAULT_EXPANDED_SECTIONS]
  }

  try {
    const storedValue = window.sessionStorage.getItem(
      EXPANDED_SECTIONS_STORAGE_KEY,
    )

    if (!storedValue) {
      return [...DEFAULT_EXPANDED_SECTIONS]
    }

    const parsed = JSON.parse(storedValue)

    if (!Array.isArray(parsed)) {
      return [...DEFAULT_EXPANDED_SECTIONS]
    }

    return parsed.filter((entry): entry is string => typeof entry === "string")
  } catch (error) {
    console.warn("Failed to read dashboard navigation state:", error)
    return [...DEFAULT_EXPANDED_SECTIONS]
  }
}

function sanitizeExpandedSections(
  sections: string[],
  validSectionNames: string[],
): string[] {
  const deduped: string[] = []

  sections.forEach((section) => {
    if (!validSectionNames.includes(section)) {
      return
    }

    if (deduped.includes(section)) {
      return
    }

    deduped.push(section)
  })

  if (deduped.length > 0) {
    return deduped
  }

  const fallback = DEFAULT_EXPANDED_SECTIONS.filter((section) =>
    validSectionNames.includes(section),
  )

  if (fallback.length > 0) {
    return [...fallback]
  }

  return [...validSectionNames]
}

function arraysAreEqual(first: readonly string[], second: readonly string[]) {
  if (first.length !== second.length) {
    return false
  }

  return first.every((value, index) => value === second[index])
}

export function DashboardLayout({
  children,
  className,
  mobileActions,
  title,
  dict,
  lang,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const pathWithoutLocale = useMemo(
    () => pathname.replace(/^\/(en-US|nl-NL)/, ""),
    [pathname],
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigationSections = useMemo(() => createNavigationSections(), [])
  const validSectionNames = useMemo(
    () =>
      navigationSections
        .filter((section) => section.type === "section")
        .map((section) => section.name as string),
    [navigationSections],
  )
  const [expandedSections, setExpandedSections] = useState<string[]>(() =>
    sanitizeExpandedSections(getInitialExpandedSections(), validSectionNames),
  )
  const desktopNavScrollRef = useRef<HTMLDivElement | null>(null)

  // Get user data from Redux
  const user = useAppSelector(selectUser)
  const rawUserKarma = useAppSelector(selectKarmaBalance(user?.id || ""))
  const userKarma = Number.isFinite(rawUserKarma) ? rawUserKarma : 0
  const karmaLabel = useMemo(() => {
    const template = dict.dashboard.navigation.karma

    if (typeof template !== "string") {
      return `${userKarma}`
    }

    return formatTemplate(template, { count: userKarma })
  }, [dict.dashboard.navigation.karma, userKarma])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.sessionStorage.setItem(
      EXPANDED_SECTIONS_STORAGE_KEY,
      JSON.stringify(expandedSections),
    )
  }, [expandedSections])

  useEffect(() => {
    setExpandedSections((previous) => {
      const sanitized = sanitizeExpandedSections(previous, validSectionNames)
      return arraysAreEqual(previous, sanitized) ? previous : sanitized
    })
  }, [validSectionNames])

  useEffect(() => {
    const activeSection = navigationSections.find(
      (section) =>
        section.type === "section" &&
        section.items?.some((item) => item.href === pathWithoutLocale),
    )

    if (!activeSection) {
      return
    }

    const sectionName = activeSection.name as string

    setExpandedSections((previous) => {
      if (previous.includes(sectionName)) {
        return previous
      }

      return [...previous, sectionName]
    })
  }, [navigationSections, pathWithoutLocale])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const rootElement = desktopNavScrollRef.current

    if (!rootElement) {
      return
    }

    const viewport = rootElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )

    if (!viewport) {
      return
    }

    const storedScrollTop = window.sessionStorage.getItem(
      SCROLL_POSITION_STORAGE_KEY,
    )

    if (storedScrollTop) {
      const parsed = Number.parseInt(storedScrollTop, 10)
      if (!Number.isNaN(parsed)) {
        viewport.scrollTop = parsed
      }
    }

    const updateStoredScroll = () => {
      window.sessionStorage.setItem(
        SCROLL_POSITION_STORAGE_KEY,
        Math.round(viewport.scrollTop).toString(),
      )
    }

    updateStoredScroll()
    viewport.addEventListener("scroll", updateStoredScroll, { passive: true })

    return () => {
      viewport.removeEventListener("scroll", updateStoredScroll)
      updateStoredScroll()
    }
  }, [])
  
  // Calculate user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  
  const userInitials = user?.name ? getInitials(user.name) : "?"
  const userName = user?.name || "Loading..."
  const userFamily = user?.families?.[0]?.name || ""
  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName) ? prev.filter((s) => s !== sectionName) : [...prev, sectionName],
    )
  }

  const NavigationItemComponent = ({
    item,
    isSingleItem,
    onNavigate,
  }: {
    item: NavigationItem | NavigationSection
    isSingleItem?: boolean
    onNavigate?: () => void
  }) => {
    const itemName = isSingleItem ? (item as NavigationItem).name : (item as NavigationSection).name
    const itemHref = isSingleItem ? (item as NavigationItem).href : (item as NavigationSection).href
    const isDisabled = isSingleItem ? (item as NavigationItem).disabled : false
    const isActive = itemHref === pathWithoutLocale
    const testId = `nav-${itemName.replace(/([A-Z])/g, '-$1').toLowerCase()}`

    return (
      <Link
        href={isDisabled ? "#" : itemHref || "#"}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : isDisabled
              ? "text-muted-foreground/50 cursor-not-allowed"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        )}
        data-testid={testId}
      >
        {item.icon && <item.icon className={isSingleItem ? "h-5 w-5" : "h-4 w-4"} />}
        <span>{dict.dashboard.navigation[itemName]}</span>
        {isDisabled && <Badge variant="secondary" className="ml-auto text-xs">{dict.dashboard.navigation.soon}</Badge>}
      </Link>
    )
  }

  const SectionNavigationComponent = ({
    section,
    onNavigate,
  }: {
    section: NavigationSection
    onNavigate?: () => void
  }) => {
    const isExpanded = expandedSections.includes(section.name as string)
    const testId = `nav-section-${section.name.replace(/([A-Z])/g, '-$1').toLowerCase()}`

    return (
      <Collapsible
        key={section.name}
        open={isExpanded}
        onOpenChange={() => toggleSection(section.name as string)}
        data-testid={testId}
      >
        <CollapsibleTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full" data-testid={`${testId}-trigger`}>
          <section.icon className="h-5 w-5" />
          {dict.dashboard.navigation[section.name]}
          <ChevronDown
            className={cn(
              "h-4 w-4 ml-auto transition-transform",
              isExpanded && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {section.items?.map((item) => (
            <div key={item.name} className="pl-8">
              <NavigationItemComponent item={item} isSingleItem onNavigate={onNavigate} />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  const DesktopNavContent = () => (
    <div className="flex flex-col h-full" data-testid="desktop-nav-content">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group" data-testid="desktop-logo">
          <div className="relative w-8 h-8">
            <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80 transition-transform group-hover:scale-110" />
            <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80 transition-transform group-hover:scale-110" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Famly
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea ref={desktopNavScrollRef} className="flex-1 px-3 py-4">
        <nav className="space-y-1" data-testid="desktop-navigation">
          {navigationSections.map((section) => {
            if (section.type === "single") {
              return (
                <NavigationItemComponent
                  key={section.name}
                  item={section}
                  isSingleItem
                />
              )
            }

            return (
              <SectionNavigationComponent
                key={section.name}
                section={section}
              />
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="p-4 border-t border-border" data-testid="desktop-user-profile">
        <Link
          href="/app/profile"
          className="flex items-center gap-3 w-full hover:bg-accent rounded-lg p-2 transition-colors"
          data-testid="user-profile-link"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground font-semibold" data-testid="user-avatar">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate" data-testid="user-name">{userName}</p>
            {userFamily && <p className="text-xs text-muted-foreground truncate" data-testid="user-family">{userFamily}</p>}
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-semibold text-primary" data-testid="user-karma">{karmaLabel}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )

  const TabletNavContent = () => {
    const allItems = navigationSections.flatMap((section) => {
      if (section.type === "single") {
        return [section as NavigationItem]
      }
      return section.items || []
    })

    return (
      <div className="flex flex-col h-full" data-testid="tablet-nav-content">
        {/* Logo - Icon only, no text */}
        <div className="p-4 border-b border-border flex justify-center">
          <Link href="/" className="group" data-testid="tablet-logo">
            <div className="relative w-8 h-8">
              <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80 transition-transform group-hover:scale-110" />
              <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80 transition-transform group-hover:scale-110" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80 transition-transform group-hover:scale-110" />
            </div>
          </Link>
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
          <Link
            href="/app/profile"
            className="flex flex-col items-center gap-2 w-full hover:bg-accent rounded-lg p-2 transition-colors"
            data-testid="tablet-user-profile-link"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground font-semibold" data-testid="tablet-user-avatar">
              {userInitials}
            </div>
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-semibold text-primary" data-testid="tablet-user-karma">{userKarma}</span>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  const MobileNavContent = () => (
    <div className="flex flex-col h-full" data-testid="mobile-nav-content">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)} data-testid="mobile-drawer-logo">
          <div className="relative w-8 h-8">
            <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80 transition-transform group-hover:scale-110" />
            <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80 transition-transform group-hover:scale-110" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80 transition-transform group-hover:scale-110" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Famly
          </span>
        </Link>
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
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    pathWithoutLocale === section.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  data-testid={`nav-${section.name.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                >
                  <section.icon className="h-5 w-5" />
                  {dict.dashboard.navigation[section.name]}
                </Link>
              )
            }

            return (
              <Collapsible
                key={section.name}
                open={expandedSections.includes(section.name as string)}
                onOpenChange={() => toggleSection(section.name as string)}
              >
                <CollapsibleTrigger className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full">
                  <section.icon className="h-5 w-5" />
                  {dict.dashboard.navigation[section.name]}
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 ml-auto transition-transform",
                      expandedSections.includes(section.name as string) && "rotate-180",
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {section.items?.map((item) => {
                    const isActive = pathWithoutLocale === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.disabled ? "#" : item.href}
                        onClick={() => !item.disabled && setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 pl-11 pr-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : item.disabled
                              ? "text-muted-foreground/50 cursor-not-allowed"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )}
                        data-testid={`nav-${item.name.replace(/([A-Z])/g, '-$1').toLowerCase()}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {dict.dashboard.navigation[item.name]}
                        {item.disabled && <Badge variant="secondary" className="ml-auto text-xs">{dict.dashboard.navigation.soon}</Badge>}
                      </Link>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info */}
      <div className="p-4 border-t border-border" data-testid="mobile-user-profile">
        <Link
          href="/app/profile"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 w-full hover:bg-accent rounded-lg p-2 transition-colors"
          data-testid="mobile-user-profile-link"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground font-semibold" data-testid="mobile-user-avatar">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate" data-testid="mobile-user-name">{userName}</p>
            {userFamily && <p className="text-xs text-muted-foreground truncate" data-testid="mobile-user-family">{userFamily}</p>}
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="text-xs font-semibold text-primary" data-testid="mobile-user-karma">{karmaLabel}</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background" data-testid="dashboard-layout">
      {/* Mobile Header - Only on small screens */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border" data-testid="mobile-header">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2" data-testid="mobile-logo">
              <div className="relative w-8 h-8">
                <div className="absolute top-0 left-0 w-5 h-5 rounded-full bg-primary opacity-80" />
                <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-chart-2 opacity-80" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-chart-3 opacity-80" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                Famly
              </span>
            </Link>
            {title && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-lg font-semibold" data-testid="mobile-page-title">{title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mobileActions}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72 h-full flex flex-col" data-testid="mobile-drawer">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <MobileNavContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Tablet Sidebar - Icons only, always visible on md to lg screens */}
      <aside className="hidden md:flex lg:hidden fixed inset-y-0 w-20 flex-col border-r border-border bg-card z-40" data-testid="tablet-sidebar">
        <TabletNavContent />
      </aside>

      {/* Desktop Sidebar - Full width with text, always visible on lg+ screens */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col border-r border-border bg-card z-40" data-testid="desktop-sidebar">
        <DesktopNavContent />
      </aside>

      {/* Main Content */}
      <main className="md:pl-20 lg:pl-72" data-testid="main-content">
        <div className={cn(className || "p-6", "!pt-20 md:!pt-6")} data-testid="page-content">{children}</div>
      </main>
    </div>
  )
}
