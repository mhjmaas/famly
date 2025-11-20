/**
 * Get the start of the current week (Sunday 18:00 UTC)
 * Week starts on Sunday at 18:00 UTC and ends the following Sunday at 18:00 UTC
 */
export function getCurrentWeekStart(): Date {
  const now = new Date();
  const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentHour = now.getUTCHours();

  // Calculate the most recent Sunday 18:00 UTC
  const daysToSubtract = currentDay === 0 && currentHour < 18 ? 7 : currentDay;

  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - daysToSubtract);
  weekStart.setUTCHours(18, 0, 0, 0);

  return weekStart;
}

/**
 * Check if a given weekStartDate represents the current week
 */
export function isCurrentWeek(weekStartDate: Date): boolean {
  const currentWeekStart = getCurrentWeekStart();
  return weekStartDate.getTime() === currentWeekStart.getTime();
}

/**
 * Get the end of a week given its start date
 */
export function getWeekEnd(weekStartDate: Date): Date {
  const weekEnd = new Date(weekStartDate);
  weekEnd.setUTCDate(weekStartDate.getUTCDate() + 7);
  return weekEnd;
}
