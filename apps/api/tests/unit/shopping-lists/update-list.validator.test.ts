import { updateListSchema } from "../../../src/modules/shopping-lists/validators/update-list.validator";

describe("updateListSchema", () => {
  describe("name field validation", () => {
    it("should accept valid list names", () => {
      const result = updateListSchema.parse({ name: "Updated Groceries" });
      expect(result.name).toBe("Updated Groceries");
    });

    it("should reject empty names", () => {
      expect(() => updateListSchema.parse({ name: "" })).toThrow();
    });

    it("should reject names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() => updateListSchema.parse({ name: longName })).toThrow();
    });

    it("should accept names up to 200 characters", () => {
      const longName = "a".repeat(200);
      const result = updateListSchema.parse({ name: longName });
      expect(result.name).toBe(longName);
    });

    it("should be optional", () => {
      const result = updateListSchema.parse({});
      expect(result.name).toBeUndefined();
    });
  });

  describe("tags field validation", () => {
    it("should accept valid tags array", () => {
      const result = updateListSchema.parse({
        tags: ["fresh", "organic"],
      });
      expect(result.tags).toEqual(["fresh", "organic"]);
    });

    it("should accept empty tags array (to clear tags)", () => {
      const result = updateListSchema.parse({
        tags: [],
      });
      expect(result.tags).toEqual([]);
    });

    it("should reject tags array with more than 20 tags", () => {
      const manyTags = Array(21).fill("tag");
      expect(() =>
        updateListSchema.parse({
          tags: manyTags,
        }),
      ).toThrow();
    });

    it("should accept up to 20 tags", () => {
      const manyTags = Array(20).fill("tag");
      const result = updateListSchema.parse({
        tags: manyTags,
      });
      expect(result.tags).toHaveLength(20);
    });

    it("should reject tags longer than 50 characters", () => {
      const longTag = "a".repeat(51);
      expect(() =>
        updateListSchema.parse({
          tags: [longTag],
        }),
      ).toThrow();
    });

    it("should accept tags up to 50 characters", () => {
      const longTag = "a".repeat(50);
      const result = updateListSchema.parse({
        tags: [longTag],
      });
      expect(result.tags).toContain(longTag);
    });

    it("should be optional", () => {
      const result = updateListSchema.parse({});
      expect(result.tags).toBeUndefined();
    });
  });

  describe("payload validation", () => {
    it("should accept empty object (no update)", () => {
      const result = updateListSchema.parse({});
      expect(result).toEqual({});
    });

    it("should ignore extra fields", () => {
      const result = updateListSchema.parse({
        name: "Groceries",
        extraField: "ignored",
      });
      expect(result).toEqual({ name: "Groceries" });
    });

    it("should accept updating only name", () => {
      const result = updateListSchema.parse({ name: "New Name" });
      expect(result).toEqual({ name: "New Name" });
    });

    it("should accept updating only tags", () => {
      const result = updateListSchema.parse({ tags: ["new-tag"] });
      expect(result).toEqual({ tags: ["new-tag"] });
    });

    it("should accept updating both name and tags", () => {
      const result = updateListSchema.parse({
        name: "New Name",
        tags: ["new-tag"],
      });
      expect(result).toEqual({ name: "New Name", tags: ["new-tag"] });
    });
  });
});
