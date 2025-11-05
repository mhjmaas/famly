"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { NavigationItem as NavigationItemType, NavigationSection, Dictionary } from "@/types/dashboard-layout.types"

interface NavigationItemProps {
  item: NavigationItemType | NavigationSection
  isSingleItem?: boolean
  isActive: boolean
  dict: Dictionary
  onNavigate?: () => void
}

export function NavigationItem({
  item,
  isSingleItem,
  isActive,
  dict,
  onNavigate,
}: NavigationItemProps) {
  const itemName = isSingleItem ? (item as NavigationItemType).name : (item as NavigationSection).name
  const itemHref = isSingleItem ? (item as NavigationItemType).href : (item as NavigationSection).href
  const isDisabled = isSingleItem ? (item as NavigationItemType).disabled : false
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
