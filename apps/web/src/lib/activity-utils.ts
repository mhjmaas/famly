import { format } from "date-fns";
import { CheckCircle2, Gift, type LucideIcon } from "lucide-react";
import type { ActivityEvent } from "./api-client";

export interface EventGroup {
  date: string; // YYYY-MM-DD
  displayDate: string; // "Monday, November 3, 2025"
  events: ActivityEvent[];
}

/**
 * Groups activity events by date
 */
export function groupEventsByDate(events: ActivityEvent[]): EventGroup[] {
  const groups = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const date = event.createdAt.split("T")[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }

    const foundGroup = groups.get(date);
    if (foundGroup) {
      foundGroup.push(event);
    }
  }

  return Array.from(groups.entries())
    .map(([date, events]) => ({
      date,
      displayDate: formatActivityDate(date),
      events,
    }))
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
}

/**
 * Formats a date string for activity timeline display
 */
export function formatActivityDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  } catch {
    return dateString;
  }
}

/**
 * Formats a timestamp for activity timeline display (time only)
 */
export function formatActivityTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return format(date, "h:mm a");
  } catch {
    return "";
  }
}

/**
 * Returns the appropriate icon for an activity event type
 */
export function getActivityEventIcon(type: ActivityEvent["type"]): LucideIcon {
  switch (type) {
    case "TASK":
      return CheckCircle2;
    case "REWARD":
      return Gift;
    case "SHOPPING_LIST":
      return CheckCircle2;
    case "KARMA":
      return CheckCircle2;
    case "RECIPE":
      return CheckCircle2;
    case "DIARY":
      return CheckCircle2;
    case "FAMILY_DIARY":
      return CheckCircle2;
    default:
      return CheckCircle2;
  }
}

/**
 * Returns the appropriate color class for karma change
 */
export function getActivityEventColor(karma?: number): string {
  if (!karma) return "text-muted-foreground";
  return karma > 0 ? "text-chart-2" : "text-destructive";
}

/**
 * Returns the appropriate background color class for event icon
 */
export function getActivityEventBgColor(type: ActivityEvent["type"]): string {
  switch (type) {
    case "TASK":
      return "bg-chart-2/10 text-chart-2";
    case "REWARD":
      return "bg-primary/10 text-primary";
    case "SHOPPING_LIST":
      return "bg-blue-500/10 text-blue-500";
    case "KARMA":
      return "bg-yellow-500/10 text-yellow-500";
    case "RECIPE":
      return "bg-green-500/10 text-green-500";
    case "DIARY":
      return "bg-purple-500/10 text-purple-500";
    case "FAMILY_DIARY":
      return "bg-pink-500/10 text-pink-500";
    default:
      return "bg-muted text-muted-foreground";
  }
}
