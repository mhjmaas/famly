import type React from "react";
import type { Locale } from "@/i18n/config";

export type Dictionary = {
  dashboard: {
    navigation: {
      dashboard: string;
      family: string;
      members: string;
      tasks: string;
      shoppingLists: string;
      recipes: string;
      rewards: string;
      calendar: string;
      locations: string;
      memories: string;
      aiSettings: string;
      personal: string;
      diary: string;
      chat: string;
      settings: string;
      soon: string;
      karma: string;
    };
  };
  languageSelector?: {
    ariaLabel: string;
  };
  pwa: {
    notifications: {
      title: string;
      description: string;
      benefits: {
        updates: string;
        instant: string;
        events: string;
      };
      allow: string;
      notNow: string;
    };
    install: {
      title: string;
      description: string;
      iosInstructions: string;
      install: string;
      later: string;
    };
  };
};

export interface NavigationItem {
  name: keyof Dictionary["dashboard"]["navigation"];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface NavigationSection {
  type: "single" | "section";
  name: keyof Dictionary["dashboard"]["navigation"];
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  items?: NavigationItem[];
}

export interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  mobileActions?: React.ReactNode;
  title?: string;
  dict: Dictionary;
  lang: Locale;
}

export interface UserProfileData {
  initials: string;
  name: string;
  family: string;
  karma: number;
  karmaLabel: string;
}
