import { createRecipeSchema } from "../../../src/modules/recipes/validators/create-recipe.validator";
import { listRecipesSchema } from "../../../src/modules/recipes/validators/list-recipes.validator";
import { searchRecipesSchema } from "../../../src/modules/recipes/validators/search-recipes.validator";
import { updateRecipeSchema } from "../../../src/modules/recipes/validators/update-recipe.validator";

describe("Recipe Validators", () => {
  describe("createRecipeSchema", () => {
    describe("name validation", () => {
      it("should accept valid names", () => {
        const result = createRecipeSchema.parse({
          name: "Pasta Carbonara",
          description: "Classic pasta",
          steps: ["Cook pasta"],
        });
        expect(result.name).toBe("Pasta Carbonara");
      });

      it("should reject empty names", () => {
        expect(() =>
          createRecipeSchema.parse({
            name: "",
            description: "Desc",
            steps: ["Step"],
          }),
        ).toThrow();
      });

      it("should reject names longer than 200 characters", () => {
        const longName = "a".repeat(201);
        expect(() =>
          createRecipeSchema.parse({
            name: longName,
            description: "Desc",
            steps: ["Step"],
          }),
        ).toThrow();
      });

      it("should accept names up to 200 characters", () => {
        const longName = "a".repeat(200);
        const result = createRecipeSchema.parse({
          name: longName,
          description: "Desc",
          steps: ["Step"],
        });
        expect(result.name).toBe(longName);
      });
    });

    describe("description validation", () => {
      it("should accept valid descriptions", () => {
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "A wonderful recipe",
          steps: ["Step"],
        });
        expect(result.description).toBe("A wonderful recipe");
      });

      it("should reject empty descriptions", () => {
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "",
            steps: ["Step"],
          }),
        ).toThrow();
      });

      it("should reject descriptions longer than 2000 characters", () => {
        const longDesc = "a".repeat(2001);
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: longDesc,
            steps: ["Step"],
          }),
        ).toThrow();
      });

      it("should accept descriptions up to 2000 characters", () => {
        const longDesc = "a".repeat(2000);
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: longDesc,
          steps: ["Step"],
        });
        expect(result.description).toBe(longDesc);
      });
    });

    describe("steps validation", () => {
      it("should accept multiple steps", () => {
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Prepare", "Cook", "Serve"],
        });
        expect(result.steps).toEqual(["Prepare", "Cook", "Serve"]);
      });

      it("should reject empty steps array", () => {
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "Desc",
            steps: [],
          }),
        ).toThrow();
      });

      it("should reject empty step strings", () => {
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "Desc",
            steps: ["Step 1", "", "Step 3"],
          }),
        ).toThrow();
      });

      it("should reject steps longer than 500 characters", () => {
        const longStep = "a".repeat(501);
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "Desc",
            steps: [longStep],
          }),
        ).toThrow();
      });

      it("should accept steps up to 500 characters", () => {
        const longStep = "a".repeat(500);
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: [longStep],
        });
        expect(result.steps[0]).toBe(longStep);
      });
    });

    describe("tags validation", () => {
      it("should accept valid tags", () => {
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: ["breakfast", "vegetarian"],
        });
        expect(result.tags).toEqual(["breakfast", "vegetarian"]);
      });

      it("should accept empty tags array", () => {
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: [],
        });
        expect(result.tags).toEqual([]);
      });

      it("should reject more than 20 tags", () => {
        const manyTags = Array(21).fill("tag");
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "Desc",
            steps: ["Step"],
            tags: manyTags,
          }),
        ).toThrow();
      });

      it("should accept up to 20 tags", () => {
        const manyTags = Array(20).fill("tag");
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: manyTags,
        });
        expect(result.tags).toHaveLength(20);
      });

      it("should reject tags longer than 50 characters", () => {
        const longTag = "a".repeat(51);
        expect(() =>
          createRecipeSchema.parse({
            name: "Recipe",
            description: "Desc",
            steps: ["Step"],
            tags: [longTag],
          }),
        ).toThrow();
      });

      it("should accept tags up to 50 characters", () => {
        const longTag = "a".repeat(50);
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: [longTag],
        });
        expect(result.tags).toContain(longTag);
      });

      it("should be optional", () => {
        const result = createRecipeSchema.parse({
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
        });
        expect(result.tags).toBeUndefined();
      });
    });
  });

  describe("updateRecipeSchema", () => {
    it("should accept partial updates", () => {
      const result = updateRecipeSchema.parse({
        name: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
      expect(result.description).toBeUndefined();
    });

    it("should accept name update", () => {
      const result = updateRecipeSchema.parse({
        name: "New Name",
      });
      expect(result.name).toBe("New Name");
    });

    it("should accept description update", () => {
      const result = updateRecipeSchema.parse({
        description: "New description",
      });
      expect(result.description).toBe("New description");
    });

    it("should accept steps update", () => {
      const result = updateRecipeSchema.parse({
        steps: ["New step 1", "New step 2"],
      });
      expect(result.steps).toEqual(["New step 1", "New step 2"]);
    });

    it("should accept tags update", () => {
      const result = updateRecipeSchema.parse({
        tags: ["new-tag"],
      });
      expect(result.tags).toEqual(["new-tag"]);
    });

    it("should accept all fields at once", () => {
      const result = updateRecipeSchema.parse({
        name: "Name",
        description: "Desc",
        steps: ["Step"],
        tags: ["tag"],
      });
      expect(result).toEqual({
        name: "Name",
        description: "Desc",
        steps: ["Step"],
        tags: ["tag"],
      });
    });

    it("should reject empty name", () => {
      expect(() =>
        updateRecipeSchema.parse({
          name: "",
        }),
      ).toThrow();
    });

    it("should reject empty steps array", () => {
      expect(() =>
        updateRecipeSchema.parse({
          steps: [],
        }),
      ).toThrow();
    });

    it("should allow partial empty object", () => {
      const result = updateRecipeSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe("listRecipesSchema", () => {
    it("should accept default pagination", () => {
      const result = listRecipesSchema.parse({});
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should accept custom limit", () => {
      const result = listRecipesSchema.parse({ limit: "25" });
      expect(result.limit).toBe(25);
    });

    it("should accept custom offset", () => {
      const result = listRecipesSchema.parse({ offset: "50" });
      expect(result.offset).toBe(50);
    });

    it("should accept both limit and offset", () => {
      const result = listRecipesSchema.parse({
        limit: "20",
        offset: "40",
      });
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(40);
    });

    it("should reject limit > 100", () => {
      expect(() => listRecipesSchema.parse({ limit: "101" })).toThrow();
    });

    it("should accept limit = 100", () => {
      const result = listRecipesSchema.parse({ limit: "100" });
      expect(result.limit).toBe(100);
    });

    it("should reject negative offset", () => {
      expect(() => listRecipesSchema.parse({ offset: "-1" })).toThrow();
    });

    it("should accept offset = 0", () => {
      const result = listRecipesSchema.parse({ offset: "0" });
      expect(result.offset).toBe(0);
    });

    it("should reject limit < 1", () => {
      expect(() => listRecipesSchema.parse({ limit: "0" })).toThrow();
    });
  });

  describe("searchRecipesSchema", () => {
    it("should accept valid search query", () => {
      const result = searchRecipesSchema.parse({
        query: "pasta",
      });
      expect(result.query).toBe("pasta");
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should reject empty query", () => {
      expect(() =>
        searchRecipesSchema.parse({
          query: "",
        }),
      ).toThrow();
    });

    it("should accept query with pagination", () => {
      const result = searchRecipesSchema.parse({
        query: "bread",
        limit: "20",
        offset: "10",
      });
      expect(result.query).toBe("bread");
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(10);
    });

    it("should default limit and offset", () => {
      const result = searchRecipesSchema.parse({
        query: "search term",
      });
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it("should accept query with spaces", () => {
      const result = searchRecipesSchema.parse({
        query: "chocolate cake",
      });
      expect(result.query).toBe("chocolate cake");
    });
  });
});
