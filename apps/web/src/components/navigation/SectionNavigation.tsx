"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { NavigationItem } from "./NavigationItem"
import type { NavigationSection, Dictionary } from "@/types/dashboard-layout.types"

interface SectionNavigationProps {
  section: NavigationSection
  isExpanded: boolean
  pathWithoutLocale: string
  dict: Dictionary
  onToggleSection: (sectionName: string) => void
  onNavigate?: () => void
}

export function SectionNavigation({
  section,
  isExpanded,
  pathWithoutLocale,
  dict,
  onToggleSection,
  onNavigate,
}: SectionNavigationProps) {
  const testId = `nav-section-${section.name.replace(/([A-Z])/g, '-$1').toLowerCase()}`

  return (
    <Collapsible
      key={section.name}
      open={isExpanded}
      onOpenChange={() => onToggleSection(section.name as string)}
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
            <NavigationItem
              item={item}
              isSingleItem
              isActive={item.href === pathWithoutLocale}
              dict={dict}
              onNavigate={onNavigate}
            />
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}
