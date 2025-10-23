import { createEntrySchema } from "../../../src/modules/diary/validators/create-entry.validator";

describe("createEntrySchema", () => {
  describe("date field validation", () => {
    it("should accept valid date in YYYY-MM-DD format", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "Today was a great day",
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
        const result = createEntrySchema.parse({
          date,
          entry: "Test entry",
        });
        expect(result.date).toBe(date);
      });
    });

    it("should reject invalid date format with dashes instead of hyphens", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025.01.15",
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject invalid date format with slashes", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "01/15/2025",
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject date with incorrect month padding", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-1-15",
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject date with incorrect day padding", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-5",
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject date with incorrect year", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "25-01-15",
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject missing date field", () => {
      expect(() =>
        createEntrySchema.parse({
          entry: "Today was a great day",
        }),
      ).toThrow();
    });

    it("should reject null date", () => {
      expect(() =>
        createEntrySchema.parse({
          date: null,
          entry: "Today was a great day",
        }),
      ).toThrow();
    });
  });

  describe("entry field validation", () => {
    it("should accept valid entry text", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "This is a diary entry about my day",
      });
      expect(result.entry).toBe("This is a diary entry about my day");
    });

    it("should accept entry with exactly 1 character", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "A",
      });
      expect(result.entry).toBe("A");
      expect(result.entry.length).toBe(1);
    });

    it("should accept entry with exactly 10,000 characters", () => {
      const longEntry = "a".repeat(10000);
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: longEntry,
      });
      expect(result.entry).toBe(longEntry);
      expect(result.entry.length).toBe(10000);
    });

    it("should reject entry with empty string", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
          entry: "",
        }),
      ).toThrow();
    });

    it("should reject entry exceeding 10,000 characters", () => {
      const tooLongEntry = "a".repeat(10001);
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
          entry: tooLongEntry,
        }),
      ).toThrow();
    });

    it("should reject entry with 20,000 characters", () => {
      const tooLongEntry = "a".repeat(20000);
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
          entry: tooLongEntry,
        }),
      ).toThrow();
    });

    it("should accept entry with special characters", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "Today was amazing! @#$%^&*()_+-=[]{}|;:',.<>?/",
      });
      expect(result.entry).toContain("@#$%^&*()_+-=[]{}|;:',.<>?/");
    });

    it("should accept entry with newlines", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "First line\nSecond line\nThird line",
      });
      expect(result.entry).toContain("First line");
      expect(result.entry).toContain("Second line");
    });

    it("should accept entry with unicode characters", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "Today was wonderful! 😊 Я также люблю писать 中文",
      });
      expect(result.entry).toContain("😊");
      expect(result.entry).toContain("中文");
    });

    it("should reject missing entry field", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
        }),
      ).toThrow();
    });

    it("should reject null entry", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
          entry: null,
        }),
      ).toThrow();
    });

    it("should reject entry that is not a string", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
          entry: 12345,
        }),
      ).toThrow();
    });
  });

  describe("payload validation", () => {
    it("should accept minimal valid payload", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "My entry",
      });
      expect(result).toEqual({
        date: "2025-01-15",
        entry: "My entry",
      });
    });

    it("should ignore extra fields", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "My entry",
        extraField: "ignored",
        anotherExtra: 123,
      });
      expect(result).toEqual({
        date: "2025-01-15",
        entry: "My entry",
      });
      expect(result).not.toHaveProperty("extraField");
      expect(result).not.toHaveProperty("anotherExtra");
    });

    it("should require both date and entry fields", () => {
      expect(() =>
        createEntrySchema.parse({
          date: "2025-01-15",
        }),
      ).toThrow();

      expect(() =>
        createEntrySchema.parse({
          entry: "My entry",
        }),
      ).toThrow();
    });

    it("should accept entry with whitespace", () => {
      const result = createEntrySchema.parse({
        date: "2025-01-15",
        entry: "   spaces at start and end   ",
      });
      expect(result.entry).toBe("   spaces at start and end   ");
    });

    it("should reject empty payload", () => {
      expect(() => createEntrySchema.parse({})).toThrow();
    });

    it("should reject payload with only extra fields", () => {
      expect(() =>
        createEntrySchema.parse({
          extraField: "ignored",
        }),
      ).toThrow();
    });
  });
});
