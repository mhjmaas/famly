import { addItemSchema } from "../../../src/modules/shopping-lists/validators/add-item.validator";

describe("addItemSchema", () => {
  describe("name field validation", () => {
    it("should accept valid item names", () => {
      const result = addItemSchema.parse({ name: "Milk" });
      expect(result.name).toBe("Milk");
    });

    it("should reject empty names", () => {
      expect(() => addItemSchema.parse({ name: "" })).toThrow();
    });

    it("should reject names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() => addItemSchema.parse({ name: longName })).toThrow();
    });

    it("should accept names up to 200 characters", () => {
      const longName = "a".repeat(200);
      const result = addItemSchema.parse({ name: longName });
      expect(result.name).toBe(longName);
    });

    it("should handle names with special characters", () => {
      const result = addItemSchema.parse({ name: "Extra Virgin Olive Oil (500mL)" });
      expect(result.name).toBe("Extra Virgin Olive Oil (500mL)");
    });

    it("should preserve whitespace in names", () => {
      const result = addItemSchema.parse({ name: "  Trimmed  " });
      expect(result.name).toBe("  Trimmed  ");
    });
  });

  describe("payload validation", () => {
    it("should ignore extra fields", () => {
      const result = addItemSchema.parse({
        name: "Milk",
        extraField: "ignored",
      });
      expect(result).toEqual({ name: "Milk" });
    });

    it("should require name field", () => {
      expect(() => addItemSchema.parse({})).toThrow();
    });
  });
});
