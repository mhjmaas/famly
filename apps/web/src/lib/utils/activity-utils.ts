import { format } from "date-fns";
import { CheckCircle2, Gift, type LucideIcon } from "lucide-react";
import type { ActivityEvent } from "../api-client";

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
export function formatActivityTime(
  timestamp: string,
  options?: {
    locale?: string;
    timeZone?: string;
  },
): string {
  try {
    const formatter = new Intl.DateTimeFormat(options?.locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: options?.timeZone ?? "UTC",
    });

    return formatter.format(new Date(timestamp));
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

/**
 * Determines whether karma indicators should be displayed for an activity event
 * Based on the combination of event type and detail
 *
 * Shows karma for:
 * - TASK + COMPLETED (with positive karma)
 * - REWARD + CLAIMED (with negative karma deduction)
 * - KARMA + AWARDED (with positive karma)
 *
 * Hides karma for:
 * - All CREATED events (task, shopping list, recipe, diary)
 * - TASK + GENERATED (auto-generated tasks)
 * - REWARD + COMPLETED (completion doesn't show karma)
 * - Events without detail field (legacy events - graceful fallback shows karma)
 *
 * @param event - The activity event to check
 * @returns true if karma indicators should be shown, false otherwise
 */
export function shouldShowKarma(event: ActivityEvent): boolean {
  // If no detail field, default to showing karma (backward compatibility with legacy events)
  if (!event.detail) {
    return true;
  }

  // Show karma only for specific type + detail combinations
  switch (event.type) {
    case "TASK":
      // Only show karma for completed tasks
      return event.detail === "COMPLETED";
    case "REWARD":
      // Only show karma for claimed rewards (deduction)
      return event.detail === "CLAIMED";
    case "KARMA":
      // Only show karma for awarded karma events
      return event.detail === "AWARDED";
    case "SHOPPING_LIST":
    case "RECIPE":
    case "DIARY":
    case "FAMILY_DIARY":
      // Never show karma for creation events
      return false;
    default:
      return true;
  }
}
