"use client";

import {
  BookOpen,
  Bot,
  Calendar,
  Camera,
  CheckSquare,
  Gift,
  Home,
  MapPin,
  MessageSquare,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import type { NavigationSection } from "@/types/dashboard-layout.types";

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
      { name: "rewards", href: "/app/rewards", icon: Gift },
      {
        name: "calendar",
        href: "/app/calendar",
        icon: Calendar,
        disabled: true,
      },
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
];

export function useDashboardNavigation() {
  const navigationSections = useMemo(() => createNavigationSections(), []);

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
