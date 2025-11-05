"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { UserProfileData } from "@/types/dashboard-layout.types";

interface UserProfileDisplayProps {
  profile: UserProfileData;
  variant?: "full" | "compact" | "icon";
  onClick?: () => void;
  testIdPrefix?: string;
}

export function UserProfileDisplay({
  profile,
  variant = "full",
  onClick,
  testIdPrefix = "user",
}: UserProfileDisplayProps) {
  const avatarContent = (
    <div
      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-primary-foreground font-semibold"
      data-testid={`${testIdPrefix}-avatar`}
    >
      {profile.initials}
    </div>
  );

  if (variant === "icon") {
    return (
      <Link
        href="/app/profile"
        className="flex flex-col items-center gap-2 w-full hover:bg-accent rounded-lg p-2 transition-colors"
        onClick={onClick}
        data-testid={`${testIdPrefix}-profile-link`}
      >
        {avatarContent}
        <div className="flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
          <span
            className="text-xs font-semibold text-primary"
            data-testid={`${testIdPrefix}-karma`}
          >
            {profile.karma}
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/app/profile"
      className="flex items-center gap-3 w-full hover:bg-accent rounded-lg p-2 transition-colors"
      onClick={onClick}
      data-testid={`${testIdPrefix}-profile-link`}
    >
      {avatarContent}
      <div className="flex-1 min-w-0 text-left">
        <p
          className="text-sm font-medium truncate"
          data-testid={`${testIdPrefix}-name`}
        >
          {profile.name}
        </p>
        {profile.family && (
          <p
            className="text-xs text-muted-foreground truncate"
            data-testid={`${testIdPrefix}-family`}
          >
            {profile.family}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Sparkles className="h-3.5 w-3.5 text-primary fill-primary" />
          <span
            className="text-xs font-semibold text-primary"
            data-testid={`${testIdPrefix}-karma`}
          >
            {profile.karmaLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
