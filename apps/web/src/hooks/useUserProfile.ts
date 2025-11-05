"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/store/hooks"
import { selectUser } from "@/store/slices/user.slice"
import { selectKarmaBalance } from "@/store/slices/karma.slice"
import { formatTemplate } from "@/lib/format-template"
import type { UserProfileData, Dictionary } from "@/types/dashboard-layout.types"

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function useUserProfile(dict: Dictionary): UserProfileData {
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

  return {
    initials: user?.name ? getInitials(user.name) : "?",
    name: user?.name || "Loading...",
    family: user?.families?.[0]?.name || "",
    karma: userKarma,
    karmaLabel,
  }
}
