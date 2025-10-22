import { createListSchema } from "../../../src/modules/shopping-lists/validators/create-list.validator";

describe("createListSchema", () => {
  describe("name field validation", () => {
    it("should accept valid list names", () => {
      const result = createListSchema.parse({ name: "Weekly Groceries" });
      expect(result.name).toBe("Weekly Groceries");
    });

    it("should reject empty names", () => {
      expect(() => createListSchema.parse({ name: "" })).toThrow();
    });

    it("should reject names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() => createListSchema.parse({ name: longName })).toThrow();
    });

    it("should accept names up to 200 characters", () => {
      const longName = "a".repeat(200);
      const result = createListSchema.parse({ name: longName });
      expect(result.name).toBe(longName);
    });

    it("should handle names with special characters", () => {
      const result = createListSchema.parse({ name: "Hardware & Tools" });
      expect(result.name).toBe("Hardware & Tools");
    });
  });

  describe("tags field validation", () => {
    it("should accept valid tags array", () => {
      const result = createListSchema.parse({
        name: "Groceries",
        tags: ["fresh", "organic"],
      });
      expect(result.tags).toEqual(["fresh", "organic"]);
    });

    it("should accept empty tags array", () => {
      const result = createListSchema.parse({
        name: "Groceries",
        tags: [],
      });
      expect(result.tags).toEqual([]);
    });

    it("should reject tags array with more than 20 tags", () => {
      const manyTags = Array(21).fill("tag");
      expect(() =>
        createListSchema.parse({
          name: "Groceries",
          tags: manyTags,
        }),
      ).toThrow();
    });

    it("should accept up to 20 tags", () => {
      const manyTags = Array(20).fill("tag");
      const result = createListSchema.parse({
        name: "Groceries",
        tags: manyTags,
      });
      expect(result.tags).toHaveLength(20);
    });

    it("should reject tags longer than 50 characters", () => {
      const longTag = "a".repeat(51);
      expect(() =>
        createListSchema.parse({
          name: "Groceries",
          tags: [longTag],
        }),
      ).toThrow();
    });

    it("should accept tags up to 50 characters", () => {
      const longTag = "a".repeat(50);
      const result = createListSchema.parse({
        name: "Groceries",
        tags: [longTag],
      });
      expect(result.tags).toContain(longTag);
    });

    it("should be optional", () => {
      const result = createListSchema.parse({ name: "Groceries" });
      expect(result.tags).toBeUndefined();
    });
  });

  describe("items field validation", () => {
    it("should accept initial items array", () => {
      const result = createListSchema.parse({
        name: "Groceries",
        items: [{ name: "Milk" }, { name: "Bread" }],
      });
      expect(result.items).toHaveLength(2);
      expect(result.items?.[0].name).toBe("Milk");
    });

    it("should reject item names longer than 200 characters", () => {
      const longName = "a".repeat(201);
      expect(() =>
        createListSchema.parse({
          name: "Groceries",
          items: [{ name: longName }],
        }),
      ).toThrow();
    });

    it("should accept item names up to 200 characters", () => {
      const longName = "a".repeat(200);
      const result = createListSchema.parse({
        name: "Groceries",
        items: [{ name: longName }],
      });
      expect(result.items?.[0].name).toBe(longName);
    });

    it("should reject empty item names", () => {
      expect(() =>
        createListSchema.parse({
          name: "Groceries",
          items: [{ name: "" }],
        }),
      ).toThrow();
    });

    it("should be optional", () => {
      const result = createListSchema.parse({ name: "Groceries" });
      expect(result.items).toBeUndefined();
    });
  });

  describe("payload validation", () => {
    it("should ignore extra fields", () => {
      const result = createListSchema.parse({
        name: "Groceries",
        extraField: "ignored",
      });
      expect(result).toEqual({ name: "Groceries" });
    });

    it("should accept minimal payload", () => {
      const result = createListSchema.parse({ name: "Groceries" });
      expect(result).toEqual({ name: "Groceries" });
    });

    it("should accept full payload", () => {
      const result = createListSchema.parse({
        name: "Groceries",
        tags: ["fresh"],
        items: [{ name: "Milk" }],
      });
      expect(result).toEqual({
        name: "Groceries",
        tags: ["fresh"],
        items: [{ name: "Milk" }],
      });
    });
  });
});
