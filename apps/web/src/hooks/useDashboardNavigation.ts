"use client";

import { ALL_FEATURES, FEATURES_REGISTRY } from "@famly/shared";
import {
  BookOpen,
  Calendar,
  Camera,
  CheckSquare,
  ChefHat,
  Gift,
  Home,
  MapPin,
  MessageSquare,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentFamily } from "@/store/slices/family.slice";
import { selectEnabledFeatures } from "@/store/slices/settings.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { NavigationSection } from "@/types/dashboard-layout.types";

// Navigation items that are protected and should never be filtered by features
// Note: "settings" can still be filtered by role-based permissions
const PROTECTED_NAV_ITEMS = ["dashboard", "members"];

/**
 * Map feature keys to navigation item names
 * Used by the filter function to determine if a nav item corresponds to a feature
 */
function buildFeatureToNavMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const featureKey of ALL_FEATURES) {
    const metadata = FEATURES_REGISTRY[featureKey];
    map[featureKey] = metadata.navName;
  }
  return map;
}

const FEATURE_TO_NAV_MAP = buildFeatureToNavMap();

/**
 * Check if user has a parent role in any family
 */
function isUserParent(
  user: { families?: { role: string }[] } | null | undefined,
): boolean {
  return (
    user?.families?.some((f: { role: string }) => f.role === "Parent") ?? false
  );
}

/**
 * Build navigation sections from feature registry
 * Uses shared feature configuration as source of truth
 */
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
      {
        name: "shoppingLists",
        href: "/app/shopping-lists",
        icon: ShoppingCart,
      },
      { name: "recipes", href: "/app/recipes", icon: ChefHat },
      { name: "rewards", href: "/app/rewards", icon: Gift },
      {
        name: "calendar",
        href: "/app/calendar",
        icon: Calendar,
        disabled: true,
      },
      { name: "locations", href: "/app/locations", icon: MapPin },
      { name: "memories", href: "/app/memories", icon: Camera },
    ],
  },
  {
    type: "section",
    name: "personal",
    icon: BookOpen,
    items: [
      { name: "diary", href: "/app/diary", icon: BookOpen },
      { name: "chat", href: "/app/chat", icon: MessageSquare },
    ],
  },
  {
    type: "single",
    name: "settings",
    href: "/app/settings",
    icon: Settings,
  },
];

function filterNavigationByFeatures(
  sections: NavigationSection[],
  enabledFeatures: string[],
  user?: { families?: { role: string }[] } | null,
): NavigationSection[] {
  return sections
    .map((section) => {
      if (section.type === "single") {
        // Filter settings by user role (only show to parents)
        if (section.name === "settings") {
          return isUserParent(user) ? section : null;
        }

        // Dashboard and other single items are always visible
        if (PROTECTED_NAV_ITEMS.includes(section.name as string)) {
          return section;
        }
      }

      if (section.type === "section" && section.items) {
        // Filter items based on enabled features
        const filteredItems = section.items.filter((item) => {
          // Protected items are always visible
          if (PROTECTED_NAV_ITEMS.includes(item.name as string)) {
            return true;
          }

          // Check if the item corresponds to a feature
          const featureKey = Object.keys(FEATURE_TO_NAV_MAP).find(
            (key) => FEATURE_TO_NAV_MAP[key] === item.name,
          );

          // If no feature mapping exists, show the item
          if (!featureKey) {
            return true;
          }

          // Check if the feature is enabled
          return enabledFeatures.includes(featureKey);
        });

        // Return section with filtered items
        return {
          ...section,
          items: filteredItems,
        };
      }

      return section;
    })
    .filter((section): section is NavigationSection => {
      // Remove null entries (filtered items)
      if (section === null) {
        return false;
      }

      // Remove empty sections (no items left after filtering)
      if (section.type === "section") {
        return !!(section.items && section.items.length > 0);
      }
      return true;
    });
}

export function useDashboardNavigation() {
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);

  // Get familyId from either the full family data or user profile (for SSR/initial load)
  const familyId = currentFamily?.familyId || user?.families?.[0]?.familyId;

  // Get enabled features from Redux (preloaded via SSR in root layout)
  // Falls back to all features if not loaded (backwards compatibility)
  const enabledFeatures = useAppSelector(selectEnabledFeatures(familyId));

  const navigationSections = useMemo(
    () =>
      filterNavigationByFeatures(
        createNavigationSections(),
        enabledFeatures,
        user,
      ),
    [enabledFeatures, user],
  );

  const validSectionNames = useMemo(
    () =>
      navigationSections
        .filter((section) => section.type === "section")
        .map((section) => section.name as string),
    [navigationSections],
  );

  return {
    navigationSections,
    validSectionNames,
  };
}
