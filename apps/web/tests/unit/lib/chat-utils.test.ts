import { formatExactTime, formatRelativeTime } from "@/lib/utils/chat-utils";

describe("chat-utils", () => {
  describe("formatRelativeTime", () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-01-15T12:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return minutes for times less than 1 hour ago", () => {
      const fiveMinutesAgo = new Date("2024-01-15T11:55:00Z").toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe("5m");
    });

    it("should return 0m for just now", () => {
      const justNow = new Date("2024-01-15T12:00:00Z").toISOString();
      expect(formatRelativeTime(justNow)).toBe("0m");
    });

    it("should return 59m for 59 minutes ago", () => {
      const fiftyNineMinutesAgo = new Date(
        "2024-01-15T11:01:00Z",
      ).toISOString();
      expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe("59m");
    });

    it("should return hours for times between 1 and 24 hours ago", () => {
      const twoHoursAgo = new Date("2024-01-15T10:00:00Z").toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe("2h");
    });

    it("should return 1h for exactly 1 hour ago", () => {
      const oneHourAgo = new Date("2024-01-15T11:00:00Z").toISOString();
      expect(formatRelativeTime(oneHourAgo)).toBe("1h");
    });

    it("should return 23h for 23 hours ago", () => {
      const twentyThreeHoursAgo = new Date(
        "2024-01-14T13:00:00Z",
      ).toISOString();
      expect(formatRelativeTime(twentyThreeHoursAgo)).toBe("23h");
    });

    it("should return date string for times more than 24 hours ago", () => {
      const twoDaysAgo = new Date("2024-01-13T12:00:00Z").toISOString();
      const result = formatRelativeTime(twoDaysAgo);
      // Should be a date string (format depends on locale)
      expect(result).not.toMatch(/^\d+[mh]$/);
      expect(result).toContain("1"); // Should contain day number
    });

    it("should handle dates from different years", () => {
      const lastYear = new Date("2023-12-01T12:00:00Z").toISOString();
      const result = formatRelativeTime(lastYear);
      expect(result).not.toMatch(/^\d+[mh]$/);
    });
  });

  describe("formatExactTime", () => {
    it("should format time as HH:MM", () => {
      const dateString = new Date("2024-01-15T14:30:00Z").toISOString();
      const result = formatExactTime(dateString);
      // Result depends on locale, but should contain hour and minute
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("should handle midnight", () => {
      const midnight = new Date("2024-01-15T00:00:00Z").toISOString();
      const result = formatExactTime(midnight);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("should handle noon", () => {
      const noon = new Date("2024-01-15T12:00:00Z").toISOString();
      const result = formatExactTime(noon);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it("should handle times with seconds", () => {
      const withSeconds = new Date("2024-01-15T14:30:45Z").toISOString();
      const result = formatExactTime(withSeconds);
      // Should not include seconds
      expect(result).toMatch(/\d{1,2}:\d{2}/);
      expect(result.split(":").length).toBeLessThanOrEqual(2);
    });
  });
});
