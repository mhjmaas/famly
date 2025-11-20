import {
  getCurrentWeekStart,
  getWeekEnd,
  isCurrentWeek,
} from "@modules/contribution-goals/lib/week-utils";

describe("Week Utils", () => {
  describe("getCurrentWeekStart", () => {
    it("should return Sunday 18:00 UTC for a Monday", () => {
      // Mock current time: Monday 2025-11-24 10:00 UTC
      const mondayMorning = new Date("2025-11-24T10:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(mondayMorning);

      const weekStart = getCurrentWeekStart();

      // Should return previous Sunday 2025-11-23 18:00 UTC
      expect(weekStart.toISOString()).toBe("2025-11-23T18:00:00.000Z");
      expect(weekStart.getUTCDay()).toBe(0); // Sunday
      expect(weekStart.getUTCHours()).toBe(18);
      expect(weekStart.getUTCMinutes()).toBe(0);
      expect(weekStart.getUTCSeconds()).toBe(0);
      expect(weekStart.getUTCMilliseconds()).toBe(0);

      jest.useRealTimers();
    });

    it("should return same Sunday 18:00 UTC when called on Sunday after 18:00", () => {
      // Mock current time: Sunday 2025-11-23 20:00 UTC
      const sundayEvening = new Date("2025-11-23T20:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(sundayEvening);

      const weekStart = getCurrentWeekStart();

      // Should return same Sunday 2025-11-23 18:00 UTC
      expect(weekStart.toISOString()).toBe("2025-11-23T18:00:00.000Z");

      jest.useRealTimers();
    });

    it("should return previous Sunday 18:00 UTC when called on Sunday before 18:00", () => {
      // Mock current time: Sunday 2025-11-23 10:00 UTC
      const sundayMorning = new Date("2025-11-23T10:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(sundayMorning);

      const weekStart = getCurrentWeekStart();

      // Should return previous Sunday 2025-11-16 18:00 UTC
      expect(weekStart.toISOString()).toBe("2025-11-16T18:00:00.000Z");

      jest.useRealTimers();
    });

    it("should return correct Sunday 18:00 UTC for Saturday night", () => {
      // Mock current time: Saturday 2025-11-22 23:59 UTC
      const saturdayNight = new Date("2025-11-22T23:59:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(saturdayNight);

      const weekStart = getCurrentWeekStart();

      // Should return previous Sunday 2025-11-16 18:00 UTC
      expect(weekStart.toISOString()).toBe("2025-11-16T18:00:00.000Z");

      jest.useRealTimers();
    });

    it("should handle timezone independence (always UTC)", () => {
      // Mock current time: Monday in a different timezone context
      const mondayInDifferentTZ = new Date("2025-11-24T02:00:00.000Z"); // 2 AM UTC
      jest.useFakeTimers();
      jest.setSystemTime(mondayInDifferentTZ);

      const weekStart = getCurrentWeekStart();

      // Should still return Sunday 18:00 UTC regardless of local timezone
      expect(weekStart.toISOString()).toBe("2025-11-23T18:00:00.000Z");

      jest.useRealTimers();
    });
  });

  describe("isCurrentWeek", () => {
    it("should return true for the current week start date", () => {
      const monday = new Date("2025-11-24T10:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(monday);

      const currentWeekStart = getCurrentWeekStart();
      expect(isCurrentWeek(currentWeekStart)).toBe(true);

      jest.useRealTimers();
    });

    it("should return false for a previous week start date", () => {
      const monday = new Date("2025-11-24T10:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(monday);

      const previousWeekStart = new Date("2025-11-16T18:00:00.000Z");
      expect(isCurrentWeek(previousWeekStart)).toBe(false);

      jest.useRealTimers();
    });

    it("should return false for a future week start date", () => {
      const monday = new Date("2025-11-24T10:00:00.000Z");
      jest.useFakeTimers();
      jest.setSystemTime(monday);

      const futureWeekStart = new Date("2025-11-30T18:00:00.000Z");
      expect(isCurrentWeek(futureWeekStart)).toBe(false);

      jest.useRealTimers();
    });
  });

  describe("getWeekEnd", () => {
    it("should return the end date 7 days after the start date", () => {
      const weekStart = new Date("2025-11-23T18:00:00.000Z");
      const weekEnd = getWeekEnd(weekStart);

      expect(weekEnd.toISOString()).toBe("2025-11-30T18:00:00.000Z");
    });

    it("should handle month boundaries correctly", () => {
      const weekStart = new Date("2025-11-30T18:00:00.000Z");
      const weekEnd = getWeekEnd(weekStart);

      // Should be December 7, 2025
      expect(weekEnd.toISOString()).toBe("2025-12-07T18:00:00.000Z");
    });

    it("should handle year boundaries correctly", () => {
      const weekStart = new Date("2025-12-28T18:00:00.000Z");
      const weekEnd = getWeekEnd(weekStart);

      // Should be January 4, 2026
      expect(weekEnd.toISOString()).toBe("2026-01-04T18:00:00.000Z");
    });
  });
});
