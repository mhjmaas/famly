"use client";

import { useEffect, useState } from "react";

import { LanguageSelector } from "@/components/language-selector";
import { NotificationToggle } from "@/components/notification-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/config";
import type { ActivityEvent } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchActivityEvents,
  selectActivities,
} from "@/store/slices/activities.slice";
import { selectKarmaBalance } from "@/store/slices/karma.slice";
import { selectUser, selectUserLoading } from "@/store/slices/user.slice";
import { ActivityTimeline } from "./activity-timeline";
import { PreferencesCard } from "./preferences-card";
import { UserProfileCard } from "./user-profile-card";

interface ProfileViewProps {
  lang: Locale;
  initialEvents: ActivityEvent[];
  dict: {
    title: string;
    subtitle: string;
    karma: string;
    yearsOld: string;
    parent: string;
    child: string;
    preferences: {
      title: string;
      subtitle: string;
      language: string;
      languageDescription: string;
      theme: string;
      themeDescription: string;
      notifications: string;
      notificationsDescription: string;
    };
    activity: {
      title: string;
      subtitle: string;
      noEvents: string;
    };
    security: {
      changePassword: {
        menuLabel: string;
        title: string;
        description: string;
        currentLabel: string;
        newLabel: string;
        confirmLabel: string;
        submit: string;
        cancel: string;
        successTitle: string;
        successDescription: string;
        errors: {
          currentRequired: string;
          newRequired: string;
          confirmRequired: string;
          mismatch: string;
          minLength: string;
          reuse: string;
          invalidCurrent: string;
          generic: string;
        };
      };
    };
  };
}

export function ProfileView({ lang, initialEvents, dict }: ProfileViewProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectUserLoading);
  const karma = useAppSelector(selectKarmaBalance(user?.id || ""));
  const activities = useAppSelector(selectActivities);
  const [timeZone, setTimeZone] = useState("UTC");

  useEffect(() => {
    try {
      const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolvedTimeZone) {
        setTimeZone(resolvedTimeZone);
      }
    } catch {
      // Ignore failures and keep fallback timezone
    }
  }, []);

  // Initialize activities in Redux with server-side initial events
  useEffect(() => {
    if (user && initialEvents.length > 0) {
      // Import and use the reducer action directly
      // This sets the initial state from server-side render
      dispatch({
        type: "activities/fetchActivityEvents/fulfilled",
        payload: { events: initialEvents, timestamp: Date.now() },
      });
    }
  }, [user, initialEvents, dispatch]);

  // Fetch activities when user is available
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchActivityEvents());
    }
  }, [user?.id, dispatch]);

  // Show loading only when actively fetching or when user is not available
  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="hidden sm:block text-3xl font-bold">{dict.title}</h1>
            <p className="text-muted-foreground text-center sm:text-left">
              {dict.subtitle}
            </p>
          </div>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="profile-view">
      {/* Desktop header with theme/language selectors */}
      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        data-testid="profile-desktop-header"
      >
        <div>
          <h1
            className="hidden sm:block text-3xl font-bold"
            data-testid="profile-title"
          >
            {dict.title}
          </h1>
          <p
            className="text-muted-foreground text-center sm:text-left"
            data-testid="profile-subtitle"
          >
            {dict.subtitle}
          </p>
        </div>
        <div
          className="hidden lg:flex items-center gap-3"
          data-testid="profile-desktop-preferences"
        >
          <NotificationToggle ariaLabel="Toggle notifications" />
          <LanguageSelector lang={lang} ariaLabel="Select language" />
          <ThemeToggle />
        </div>
      </div>

      {/* User Profile Card */}
      <UserProfileCard
        user={user}
        karma={karma}
        dict={{
          karma: dict.karma,
          yearsOld: dict.yearsOld,
          parent: dict.parent,
          child: dict.child,
          security: dict.security,
        }}
        lang={lang}
      />

      {/* Preferences Card */}
      <div className="lg:hidden" data-testid="profile-mobile-preferences">
        <PreferencesCard lang={lang} dict={dict.preferences} />
      </div>

      {/* Activity Timeline */}
      <div data-testid="profile-activity-section">
        <ActivityTimeline
          events={activities}
          dict={dict.activity}
          locale={lang}
          timeZone={timeZone}
        />
      </div>
    </div>
  );
}
