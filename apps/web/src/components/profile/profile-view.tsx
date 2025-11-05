"use client";

import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Locale } from "@/i18n/config";
import type { ActivityEvent } from "@/lib/api-client";
import { useAppSelector } from "@/store/hooks";
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
        };
        activity: {
            title: string;
            subtitle: string;
            noEvents: string;
        };
    };
}

export function ProfileView({ lang, initialEvents, dict }: ProfileViewProps) {
    const user = useAppSelector(selectUser);
    const isLoading = useAppSelector(selectUserLoading);
    const karma = useAppSelector(selectKarmaBalance(user?.id || ""));

    // Show loading only when actively fetching or when user is not available
    if (isLoading || !user) {
        return (
            <div className="space-y-6">
                <div className="hidden lg:flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">{dict.title}</h1>
                        <p className="text-muted-foreground">{dict.subtitle}</p>
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
            <div className="hidden lg:flex items-center justify-between gap-4" data-testid="profile-desktop-header">
                <div>
                    <h1 className="text-3xl font-bold" data-testid="profile-title">{dict.title}</h1>
                    <p className="text-muted-foreground" data-testid="profile-subtitle">{dict.subtitle}</p>
                </div>
                <div className="flex items-center gap-3" data-testid="profile-desktop-preferences">
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
                }}
                lang={lang}
            />

            {/* Preferences Card */}
            <div className="lg:hidden" data-testid="profile-mobile-preferences">
                <PreferencesCard lang={lang} dict={dict.preferences} />
            </div>

            {/* Activity Timeline */}
            <div data-testid="profile-activity-section">
                <ActivityTimeline events={initialEvents} dict={dict.activity} />
            </div>
        </div>
    );
}
