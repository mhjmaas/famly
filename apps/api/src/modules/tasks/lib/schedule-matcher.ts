import { Schedule } from "../domain/task";

/**
 * Checks if a given day of week is in the schedule's days array
 * @param dayOfWeek - Day of week (0-6, Sunday-Saturday)
 * @param scheduleDays - Array of scheduled days
 * @returns true if day matches
 */
export function matchesDayOfWeek(
  dayOfWeek: number,
  scheduleDays: number[],
): boolean {
  return scheduleDays.includes(dayOfWeek);
}

/**
 * Checks if enough weeks have passed since last generation based on interval
 * @param lastGenerated - Last generation date (undefined for first run)
 * @param currentDate - Current date to check
 * @param interval - Weekly interval (1-4)
 * @returns true if interval requirement is met
 */
export function matchesWeeklyInterval(
  lastGenerated: Date | undefined,
  currentDate: Date,
  interval: 1 | 2 | 3 | 4,
): boolean {
  // First run - no last generated date
  if (!lastGenerated) {
    return true;
  }

  // Calculate weeks difference
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const timeDiff = currentDate.getTime() - lastGenerated.getTime();
  const weeksDiff = Math.floor(timeDiff / msPerWeek);

  // Check if enough weeks have passed
  return weeksDiff >= interval;
}

/**
 * Checks if a date falls within the schedule's start and end date range
 * @param date - Date to check
 * @param startDate - Schedule start date
 * @param endDate - Optional schedule end date
 * @returns true if date is within range
 */
export function isWithinDateRange(
  date: Date,
  startDate: Date,
  endDate?: Date,
): boolean {
  // Normalize dates to start of day for comparison
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const startOnly = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
  );

  // Check if date is before start
  if (dateOnly < startOnly) {
    return false;
  }

  // Check if date is after end (if end date exists)
  if (endDate) {
    const endOnly = new Date(
      endDate.getFullYear(),
      endDate.getMonth(),
      endDate.getDate(),
    );
    if (dateOnly > endOnly) {
      return false;
    }
  }

  return true;
}

/**
 * Determines if a task should be generated for a given date based on schedule criteria
 * @param schedule - Task schedule configuration
 * @param date - Date to check for generation
 * @param lastGenerated - Last generation date (undefined for first run)
 * @returns true if task should be generated
 */
export function shouldGenerateForDate(
  schedule: Schedule,
  date: Date,
  lastGenerated?: Date,
): boolean {
  // Check day of week
  const dayOfWeek = date.getDay();
  if (!matchesDayOfWeek(dayOfWeek, schedule.daysOfWeek)) {
    return false;
  }

  // Check weekly interval
  if (!matchesWeeklyInterval(lastGenerated, date, schedule.weeklyInterval)) {
    return false;
  }

  // Check date range
  if (!isWithinDateRange(date, schedule.startDate, schedule.endDate)) {
    return false;
  }

  return true;
}
