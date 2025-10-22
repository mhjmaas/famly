import { updateItemSchema } from "../../../src/modules/shopping-lists/validators/update-item.validator";

describe("updateItemSchema", () => {
  describe("name field validation", () => {
    it("should accept valid item names", () => {
      const result = updateItemSchema.parse({ name: "Updated Milk" });
      expect(result.name).toBe("Updated Milk");
    });

    it("should reject empty names", () => {
      expect(() => updateItemSchema.parse({ name: "" })).toThrow();
    });

    it("should reject names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() => updateItemSchema.parse({ name: longName })).toThrow();
    });

    it("should accept names up to 200 characters", () => {
      const longName = "a".repeat(200);
      const result = updateItemSchema.parse({ name: longName });
      expect(result.name).toBe(longName);
    });

    it("should be optional", () => {
      const result = updateItemSchema.parse({});
      expect(result.name).toBeUndefined();
    });
  });

  describe("checked field validation", () => {
    it("should accept checked: true", () => {
      const result = updateItemSchema.parse({ checked: true });
      expect(result.checked).toBe(true);
    });

    it("should accept checked: false", () => {
      const result = updateItemSchema.parse({ checked: false });
      expect(result.checked).toBe(false);
    });

    it("should be optional", () => {
      const result = updateItemSchema.parse({});
      expect(result.checked).toBeUndefined();
    });
  });

  describe("payload validation", () => {
    it("should accept empty object (no update)", () => {
      const result = updateItemSchema.parse({});
      expect(result).toEqual({});
    });

    it("should ignore extra fields", () => {
      const result = updateItemSchema.parse({
        name: "Milk",
        extraField: "ignored",
      });
      expect(result).toEqual({ name: "Milk" });
    });

    it("should accept updating only name", () => {
      const result = updateItemSchema.parse({ name: "New Name" });
      expect(result).toEqual({ name: "New Name" });
    });

    it("should accept updating only checked status", () => {
      const result = updateItemSchema.parse({ checked: true });
      expect(result).toEqual({ checked: true });
    });

    it("should accept updating both name and checked", () => {
      const result = updateItemSchema.parse({
        name: "New Name",
        checked: true,
      });
      expect(result).toEqual({ name: "New Name", checked: true });
    });
  });
});
