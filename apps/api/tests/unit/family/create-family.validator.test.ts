import { createFamilySchema } from "../../../src/modules/family/validators/create-family.validator";

describe("createFamilySchema", () => {
  describe("name field validation", () => {
    it("should preserve valid string names WITHOUT modification", () => {
      const result = createFamilySchema.parse({ name: "Testfamily" });
      expect(result.name).toBe("Testfamily");
    });

    it("should preserve names with spaces", () => {
      const result = createFamilySchema.parse({ name: "The Smith Family" });
      expect(result.name).toBe("The Smith Family");
    });

    it("should preserve whitespace (trimming happens in service)", () => {
      const result = createFamilySchema.parse({ name: "  Trimmed  " });
      expect(result.name).toBe("  Trimmed  ");
    });

    it("should preserve empty string (normalization happens in service)", () => {
      const result = createFamilySchema.parse({ name: "   " });
      expect(result.name).toBe("   ");
    });

    it("should accept null name", () => {
      const result = createFamilySchema.parse({ name: null });
      expect(result.name).toBeNull();
    });

    it("should accept undefined name (omitted field)", () => {
      const result = createFamilySchema.parse({});
      expect(result.name).toBeUndefined();
    });

    it("should reject names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() => createFamilySchema.parse({ name: longName })).toThrow();
    });

    it("should accept names up to 200 characters (will be trimmed to 120 by service)", () => {
      const longName = "a".repeat(200);
      const result = createFamilySchema.parse({ name: longName });
      expect(result.name).toBe(longName);
    });

    it("should handle names with special characters", () => {
      const result = createFamilySchema.parse({ name: "O'Brien-Smith & Co." });
      expect(result.name).toBe("O'Brien-Smith & Co.");
    });

    it("should handle unicode characters", () => {
      const result = createFamilySchema.parse({ name: "家族 🏠" });
      expect(result.name).toBe("家族 🏠");
    });
  });

  describe("payload validation", () => {
    it("should accept empty object", () => {
      const result = createFamilySchema.parse({});
      expect(result).toEqual({});
    });

    it("should ignore extra fields", () => {
      const result = createFamilySchema.parse({
        name: "Family",
        extraField: "ignored",
      });
      expect(result).toEqual({ name: "Family" });
    });
  });
});
