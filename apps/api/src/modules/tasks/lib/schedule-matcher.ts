import type { Schedule } from "../domain/task";

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

  // Normalize dates to start of day in UTC for comparison
  const lastGeneratedDay = new Date(
    Date.UTC(
      lastGenerated.getUTCFullYear(),
      lastGenerated.getUTCMonth(),
      lastGenerated.getUTCDate(),
    ),
  );
  const currentDay = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
    ),
  );

  // If it's the same day, don't generate again
  if (lastGeneratedDay.getTime() === currentDay.getTime()) {
    return false;
  }

  // Calculate the number of days between the two dates
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysDiff = Math.floor(
    (currentDay.getTime() - lastGeneratedDay.getTime()) / msPerDay,
  );

  // Check if enough time has passed based on interval
  // For interval 1: any day after last generation is valid
  // For interval 2: need at least 2 weeks (14 days) since last generation
  // For interval 3: need at least 3 weeks (21 days) since last generation
  // For interval 4: need at least 4 weeks (28 days) since last generation

  if (interval === 1) {
    // Weekly schedule: any day after last generation
    return daysDiff > 0;
  }

  // Multi-week intervals: need at least N full weeks
  const requiredDays = interval * 7;
  return daysDiff >= requiredDays;
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
  // Normalize dates to start of day for comparison (use UTC to avoid timezone issues)
  const dateOnly = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const startOnly = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );

  // Check if date is before start
  if (dateOnly < startOnly) {
    return false;
  }

  // Check if date is after end (if end date exists)
  if (endDate) {
    const endOnly = new Date(
      Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ),
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
