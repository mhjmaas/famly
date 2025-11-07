import type { Schedule } from "@/modules/tasks/domain/task";
import {
  isWithinDateRange,
  matchesDayOfWeek,
  matchesWeeklyInterval,
  shouldGenerateForDate,
} from "@/modules/tasks/lib/schedule-matcher";

describe("Schedule Matcher", () => {
  describe("matchesDayOfWeek", () => {
    it("should return true when day is in schedule", () => {
      expect(matchesDayOfWeek(1, [1, 3, 5])).toBe(true); // Monday
      expect(matchesDayOfWeek(3, [1, 3, 5])).toBe(true); // Wednesday
      expect(matchesDayOfWeek(5, [1, 3, 5])).toBe(true); // Friday
    });

    it("should return false when day is not in schedule", () => {
      expect(matchesDayOfWeek(0, [1, 3, 5])).toBe(false); // Sunday
      expect(matchesDayOfWeek(2, [1, 3, 5])).toBe(false); // Tuesday
      expect(matchesDayOfWeek(6, [1, 3, 5])).toBe(false); // Saturday
    });

    it("should handle single day schedule", () => {
      expect(matchesDayOfWeek(0, [0])).toBe(true);
      expect(matchesDayOfWeek(1, [0])).toBe(false);
    });

    it("should handle all days schedule", () => {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      for (let day = 0; day <= 6; day++) {
        expect(matchesDayOfWeek(day, allDays)).toBe(true);
      }
    });
  });

  describe("matchesWeeklyInterval", () => {
    it("should return true for weekly interval (1) when exactly 1 week apart", () => {
      const lastGenerated = new Date("2025-01-06"); // Monday
      const currentDate = new Date("2025-01-13"); // Next Monday
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 1)).toBe(true);
    });

    it("should return true for weekly interval (1) when 1 day apart (daily tasks)", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-07"); // Next day
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 1)).toBe(true);
    });

    it("should return true for weekly interval (1) when multiple days apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-10"); // 4 days later
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 1)).toBe(true);
    });

    it("should return false for weekly interval (1) when same day", () => {
      const lastGenerated = new Date("2025-01-06T10:00:00Z");
      const currentDate = new Date("2025-01-06T15:00:00Z"); // Same day, different time
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 1)).toBe(false);
    });

    it("should return true for biweekly interval (2) when exactly 2 weeks apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-20"); // 2 weeks later
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 2)).toBe(true);
    });

    it("should return false for biweekly interval (2) when only 1 week apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-13"); // 1 week later (7 days, need 14)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 2)).toBe(false);
    });

    it("should return false for biweekly interval (2) when 13 days apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-19"); // 13 days later (just under 2 weeks)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 2)).toBe(false);
    });

    it("should return true for 3-week interval when exactly 3 weeks apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-27"); // 3 weeks later
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 3)).toBe(true);
    });

    it("should return false for 3-week interval when only 2 weeks apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-20"); // 2 weeks later (14 days, need 21)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 3)).toBe(false);
    });

    it("should return false for 3-week interval when 20 days apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-26"); // 20 days later (just under 3 weeks)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 3)).toBe(false);
    });

    it("should return true for 4-week interval when exactly 4 weeks apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-02-03"); // 4 weeks later
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 4)).toBe(true);
    });

    it("should return false for 4-week interval when only 3 weeks apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-27"); // 3 weeks later (21 days, need 28)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 4)).toBe(false);
    });

    it("should return false for 4-week interval when 27 days apart", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-02-02"); // 27 days later (just under 4 weeks)
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 4)).toBe(false);
    });

    it("should return true when no last generated date (first run)", () => {
      const currentDate = new Date("2025-01-13");
      expect(matchesWeeklyInterval(undefined, currentDate, 1)).toBe(true);
      expect(matchesWeeklyInterval(undefined, currentDate, 2)).toBe(true);
    });

    it("should return true when more than required weeks have passed", () => {
      const lastGenerated = new Date("2025-01-06");
      const currentDate = new Date("2025-01-27"); // 3 weeks later
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 1)).toBe(true);
      expect(matchesWeeklyInterval(lastGenerated, currentDate, 2)).toBe(true);
    });
  });

  describe("isWithinDateRange", () => {
    it("should return true when date is after startDate and no endDate", () => {
      const date = new Date("2025-01-15");
      const startDate = new Date("2025-01-01");
      expect(isWithinDateRange(date, startDate, undefined)).toBe(true);
    });

    it("should return true when date equals startDate", () => {
      const date = new Date("2025-01-01");
      const startDate = new Date("2025-01-01");
      expect(isWithinDateRange(date, startDate, undefined)).toBe(true);
    });

    it("should return false when date is before startDate", () => {
      const date = new Date("2024-12-31");
      const startDate = new Date("2025-01-01");
      expect(isWithinDateRange(date, startDate, undefined)).toBe(false);
    });

    it("should return true when date is between startDate and endDate", () => {
      const date = new Date("2025-06-15");
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-12-31");
      expect(isWithinDateRange(date, startDate, endDate)).toBe(true);
    });

    it("should return true when date equals endDate", () => {
      const date = new Date("2025-12-31");
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-12-31");
      expect(isWithinDateRange(date, startDate, endDate)).toBe(true);
    });

    it("should return false when date is after endDate", () => {
      const date = new Date("2026-01-01");
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-12-31");
      expect(isWithinDateRange(date, startDate, endDate)).toBe(false);
    });

    it("should handle same day for start and end date", () => {
      const date = new Date("2025-01-01");
      const startDate = new Date("2025-01-01");
      const endDate = new Date("2025-01-01");
      expect(isWithinDateRange(date, startDate, endDate)).toBe(true);
    });
  });

  describe("shouldGenerateForDate", () => {
    it("should return true when all conditions are met", () => {
      const schedule: Schedule = {
        daysOfWeek: [1], // Monday
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
      };
      const date = new Date("2025-01-13"); // Monday, Jan 13
      const lastGenerated = new Date("2025-01-06"); // Previous Monday

      expect(shouldGenerateForDate(schedule, date, lastGenerated)).toBe(true);
    });

    it("should return false when day of week does not match", () => {
      const schedule: Schedule = {
        daysOfWeek: [1], // Monday
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
      };
      const date = new Date("2025-01-14"); // Tuesday

      expect(shouldGenerateForDate(schedule, date, undefined)).toBe(false);
    });

    it("should return false when weekly interval not met", () => {
      const schedule: Schedule = {
        daysOfWeek: [1], // Monday
        weeklyInterval: 2,
        startDate: new Date("2025-01-01"),
      };
      const date = new Date("2025-01-13"); // Monday, 1 week later
      const lastGenerated = new Date("2025-01-06");

      expect(shouldGenerateForDate(schedule, date, lastGenerated)).toBe(false);
    });

    it("should return false when date is before startDate", () => {
      const schedule: Schedule = {
        daysOfWeek: [1],
        weeklyInterval: 1,
        startDate: new Date("2025-02-01"),
      };
      const date = new Date("2025-01-13");

      expect(shouldGenerateForDate(schedule, date, undefined)).toBe(false);
    });

    it("should return false when date is after endDate", () => {
      const schedule: Schedule = {
        daysOfWeek: [1],
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      };
      const date = new Date("2025-02-03"); // Monday in February

      expect(shouldGenerateForDate(schedule, date, undefined)).toBe(false);
    });

    it("should return true for first generation (no lastGenerated)", () => {
      const schedule: Schedule = {
        daysOfWeek: [1],
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
      };
      const date = new Date("2025-01-13"); // Monday

      expect(shouldGenerateForDate(schedule, date, undefined)).toBe(true);
    });

    it("should handle multiple days of week", () => {
      const schedule: Schedule = {
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
      };
      const lastGenerated = new Date("2025-01-06"); // Monday

      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-08"), lastGenerated),
      ).toBe(true); // Wednesday (2 days later)
      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-10"), lastGenerated),
      ).toBe(true); // Friday (4 days later)
      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-13"), lastGenerated),
      ).toBe(true); // Monday (7 days later)
      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-14"), lastGenerated),
      ).toBe(false); // Tuesday (not in daysOfWeek)
    });

    it("should handle biweekly schedule correctly", () => {
      const schedule: Schedule = {
        daysOfWeek: [1],
        weeklyInterval: 2,
        startDate: new Date("2025-01-01"),
      };
      const lastGenerated = new Date("2025-01-06"); // Monday

      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-13"), lastGenerated),
      ).toBe(false); // 1 week later (7 days, need 14)
      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-20"), lastGenerated),
      ).toBe(true); // 2 weeks later (14 days = exactly 2 weeks)
    });

    it("should respect endDate boundary", () => {
      const schedule: Schedule = {
        daysOfWeek: [1],
        weeklyInterval: 1,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
      };

      expect(
        shouldGenerateForDate(schedule, new Date("2025-01-27"), undefined),
      ).toBe(true); // Last Monday in Jan
      expect(
        shouldGenerateForDate(schedule, new Date("2025-02-03"), undefined),
      ).toBe(false); // First Monday in Feb
    });
  });
});
