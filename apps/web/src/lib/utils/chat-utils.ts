/**
 * Formats a timestamp as relative time (e.g., "5m", "2h", or full date)
 * Used for chat list previews to show when the last message was sent
 *
 * @example
 * formatRelativeTime("2025-11-25T14:30:00Z") // "5m" or "2h" or "11/25/2025"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m`;
  }
  if (diffMins < 1440) {
    return `${Math.floor(diffMins / 60)}h`;
  }
  return date.toLocaleDateString();
}

/**
 * Formats a timestamp as time of day (e.g., "2:30 PM" or "14:30")
 * Used for individual message timestamps in conversations
 *
 * @example
 * formatExactTime("2025-11-25T14:30:00Z") // "2:30 PM" or "14:30"
 */
export function formatExactTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
