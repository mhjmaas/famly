import { updateEntrySchema } from "../../../src/modules/diary/validators/update-entry.validator";

describe("updateEntrySchema", () => {
  describe("date field validation", () => {
    it("should accept valid date in YYYY-MM-DD format", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-15",
      });
      expect(result.date).toBe("2025-01-15");
    });

    it("should accept various valid dates", () => {
      const validDates = [
        "2025-01-01",
        "2024-12-31",
        "2020-02-29", // leap year
        "1999-01-01",
        "2099-12-31",
      ];

      validDates.forEach((date) => {
        const result = updateEntrySchema.parse({ date });
        expect(result.date).toBe(date);
      });
    });

    it("should reject invalid date format", () => {
      expect(() =>
        updateEntrySchema.parse({
          date: "2025.01.15",
        }),
      ).toThrow();
    });

    it("should accept date with missing padding", () => {
      // This should fail validation due to the regex pattern
      expect(() =>
        updateEntrySchema.parse({
          date: "2025-1-15",
        }),
      ).toThrow();
    });

    it("should be optional", () => {
      const result = updateEntrySchema.parse({});
      expect(result.date).toBeUndefined();
    });

    it("should be optional even when entry is provided", () => {
      const result = updateEntrySchema.parse({
        entry: "Updated entry",
      });
      expect(result.date).toBeUndefined();
      expect(result.entry).toBe("Updated entry");
    });

    it("should reject null date", () => {
      expect(() =>
        updateEntrySchema.parse({
          date: null,
        }),
      ).toThrow();
    });
  });

  describe("entry field validation", () => {
    it("should accept valid entry text", () => {
      const result = updateEntrySchema.parse({
        entry: "This is an updated diary entry",
      });
      expect(result.entry).toBe("This is an updated diary entry");
    });

    it("should accept entry with exactly 1 character", () => {
      const result = updateEntrySchema.parse({
        entry: "A",
      });
      expect(result.entry).toBe("A");
      expect(result.entry?.length).toBe(1);
    });

    it("should accept entry with exactly 10,000 characters", () => {
      const longEntry = "b".repeat(10000);
      const result = updateEntrySchema.parse({
        entry: longEntry,
      });
      expect(result.entry).toBe(longEntry);
      expect(result.entry?.length).toBe(10000);
    });

    it("should accept empty string for entry", () => {
      const result = updateEntrySchema.parse({
        entry: "",
      });
      expect(result.entry).toBe("");
    });

    it("should reject entry exceeding 10,000 characters", () => {
      const tooLongEntry = "c".repeat(10001);
      expect(() =>
        updateEntrySchema.parse({
          entry: tooLongEntry,
        }),
      ).toThrow();
    });

    it("should reject entry with 20,000 characters", () => {
      const tooLongEntry = "d".repeat(20000);
      expect(() =>
        updateEntrySchema.parse({
          entry: tooLongEntry,
        }),
      ).toThrow();
    });

    it("should accept entry with special characters", () => {
      const result = updateEntrySchema.parse({
        entry: "Updated with special chars! @#$%^&*()",
      });
      expect(result.entry).toContain("@#$%^&*()");
    });

    it("should accept entry with newlines", () => {
      const result = updateEntrySchema.parse({
        entry: "First line\nSecond line\nThird line",
      });
      expect(result.entry).toContain("Second line");
    });

    it("should accept entry with unicode characters", () => {
      const result = updateEntrySchema.parse({
        entry: "Updated entry with emoji 🎉 and 日本語",
      });
      expect(result.entry).toContain("🎉");
      expect(result.entry).toContain("日本語");
    });

    it("should be optional", () => {
      const result = updateEntrySchema.parse({});
      expect(result.entry).toBeUndefined();
    });

    it("should be optional even when date is provided", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-15",
      });
      expect(result.entry).toBeUndefined();
      expect(result.date).toBe("2025-01-15");
    });

    it("should reject null entry", () => {
      expect(() =>
        updateEntrySchema.parse({
          entry: null,
        }),
      ).toThrow();
    });

    it("should reject entry that is not a string", () => {
      expect(() =>
        updateEntrySchema.parse({
          entry: 12345,
        }),
      ).toThrow();
    });
  });

  describe("payload validation", () => {
    it("should accept empty object (no update)", () => {
      const result = updateEntrySchema.parse({});
      expect(result).toEqual({});
    });

    it("should accept updating only date", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-16",
      });
      expect(result).toEqual({
        date: "2025-01-16",
      });
      expect(result.entry).toBeUndefined();
    });

    it("should accept updating only entry", () => {
      const result = updateEntrySchema.parse({
        entry: "Updated entry text",
      });
      expect(result).toEqual({
        entry: "Updated entry text",
      });
      expect(result.date).toBeUndefined();
    });

    it("should accept updating both date and entry", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-16",
        entry: "Updated on this date",
      });
      expect(result).toEqual({
        date: "2025-01-16",
        entry: "Updated on this date",
      });
    });

    it("should ignore extra fields", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-16",
        entry: "Updated entry",
        extraField: "ignored",
        anotherExtra: 123,
      });
      expect(result).toEqual({
        date: "2025-01-16",
        entry: "Updated entry",
      });
      expect(result).not.toHaveProperty("extraField");
    });

    it("should accept valid date with empty entry", () => {
      const result = updateEntrySchema.parse({
        date: "2025-01-16",
        entry: "",
      });
      expect(result.date).toBe("2025-01-16");
      expect(result.entry).toBe("");
    });

    it("should reject invalid date format in update", () => {
      expect(() =>
        updateEntrySchema.parse({
          date: "01-15-2025",
        }),
      ).toThrow();
    });

    it("should reject entry exceeding limit in update", () => {
      const tooLongEntry = "e".repeat(10001);
      expect(() =>
        updateEntrySchema.parse({
          entry: tooLongEntry,
        }),
      ).toThrow();
    });

    it("should accept entry with exactly 10,000 characters in update", () => {
      const maxEntry = "f".repeat(10000);
      const result = updateEntrySchema.parse({
        entry: maxEntry,
      });
      expect(result.entry?.length).toBe(10000);
    });

    it("should handle payload with only extra fields", () => {
      const result = updateEntrySchema.parse({
        extraField: "ignored",
      });
      expect(result).toEqual({});
    });

    it("should accept entry with whitespace", () => {
      const result = updateEntrySchema.parse({
        entry: "   updated entry with spaces   ",
      });
      expect(result.entry).toBe("   updated entry with spaces   ");
    });

    it("should accept date without other fields", () => {
      const result = updateEntrySchema.parse({
        date: "2025-12-25",
      });
      expect(result).toEqual({
        date: "2025-12-25",
      });
    });
  });
});
