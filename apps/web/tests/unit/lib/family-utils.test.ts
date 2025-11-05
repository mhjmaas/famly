import { calculateAge, getInitials } from "@/lib/family-utils";

describe("family-utils", () => {
  describe("calculateAge", () => {
    beforeEach(() => {
      // Mock current date to 2024-06-15
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-06-15"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should calculate age correctly for birthday already passed this year", () => {
      const birthdate = "1990-03-15"; // Birthday was in March
      expect(calculateAge(birthdate)).toBe(34);
    });

    it("should calculate age correctly for birthday not yet occurred this year", () => {
      const birthdate = "1990-08-20"; // Birthday is in August
      expect(calculateAge(birthdate)).toBe(33);
    });

    it("should calculate age correctly for birthday today", () => {
      const birthdate = "1990-06-15"; // Birthday is today
      expect(calculateAge(birthdate)).toBe(34);
    });

    it("should calculate age correctly for someone born this year", () => {
      const birthdate = "2024-01-01";
      expect(calculateAge(birthdate)).toBe(0);
    });

    it("should calculate age correctly for someone born last year", () => {
      const birthdate = "2023-01-01";
      expect(calculateAge(birthdate)).toBe(1);
    });

    it("should handle leap year birthdays", () => {
      const birthdate = "2000-02-29"; // Leap year birthday
      expect(calculateAge(birthdate)).toBe(24);
    });

    it("should handle edge case of birthday on last day of month", () => {
      const birthdate = "1990-05-31";
      expect(calculateAge(birthdate)).toBe(34);
    });

    it("should handle edge case of birthday on first day of month", () => {
      const birthdate = "1990-07-01"; // Birthday hasn't occurred yet
      expect(calculateAge(birthdate)).toBe(33);
    });
  });

  describe("getInitials", () => {
    it("should get initials from two-word name", () => {
      expect(getInitials("John Doe")).toBe("JD");
    });

    it("should get initials from three-word name", () => {
      expect(getInitials("John Michael Doe")).toBe("JM");
    });

    it("should get initials from single-word name", () => {
      expect(getInitials("Madonna")).toBe("M");
    });

    it("should get initials from four-word name (limit to 2)", () => {
      expect(getInitials("John Michael James Doe")).toBe("JM");
    });

    it("should handle lowercase names", () => {
      expect(getInitials("john doe")).toBe("JD");
    });

    it("should handle mixed case names", () => {
      expect(getInitials("jOhN dOe")).toBe("JD");
    });

    it("should handle names with extra spaces", () => {
      expect(getInitials("John  Doe")).toBe("JD");
    });

    it("should handle names with leading/trailing spaces", () => {
      expect(getInitials("  John Doe  ")).toBe("JD");
    });

    it("should handle hyphenated names", () => {
      expect(getInitials("Mary-Jane Watson")).toBe("MW");
    });

    it("should handle names with apostrophes", () => {
      expect(getInitials("O'Brien Smith")).toBe("OS");
    });

    it("should handle empty string", () => {
      expect(getInitials("")).toBe("");
    });

    it("should handle single character name", () => {
      expect(getInitials("J")).toBe("J");
    });
  });
});
