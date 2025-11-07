import { ObjectId } from "mongodb";
import type { Recipe } from "../../../src/modules/recipes/domain/recipe";
import {
  toRecipeDTO,
  toRecipeDTOArray,
} from "../../../src/modules/recipes/lib/recipe.mapper";

describe("Recipe Mapper", () => {
  describe("toRecipeDTO", () => {
    it("should convert Recipe to DTO", () => {
      const recipeId = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();
      const now = new Date("2025-01-15T10:30:00Z");

      const recipe: Recipe = {
        _id: recipeId,
        familyId,
        name: "Pasta Carbonara",
        description: "Classic Roman pasta",
        steps: ["Cook pasta", "Make sauce", "Combine"],
        tags: ["italian", "pasta"],
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      const dto = toRecipeDTO(recipe);

      expect(dto._id).toBe(recipeId.toString());
      expect(dto.familyId).toBe(familyId.toString());
      expect(dto.name).toBe("Pasta Carbonara");
      expect(dto.description).toBe("Classic Roman pasta");
      expect(dto.steps).toEqual(["Cook pasta", "Make sauce", "Combine"]);
      expect(dto.tags).toEqual(["italian", "pasta"]);
      expect(dto.createdBy).toBe(userId.toString());
      expect(dto.createdAt).toBe("2025-01-15T10:30:00.000Z");
      expect(dto.updatedAt).toBe("2025-01-15T10:30:00.000Z");
    });

    it("should convert ObjectIds to strings", () => {
      const recipeId = new ObjectId("507f1f77bcf86cd799439011");
      const familyId = new ObjectId("507f1f77bcf86cd799439012");
      const userId = new ObjectId("507f1f77bcf86cd799439013");

      const recipe: Recipe = {
        _id: recipeId,
        familyId,
        name: "Test Recipe",
        description: "Test description",
        steps: ["Step 1"],
        tags: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto._id).toBe("507f1f77bcf86cd799439011");
      expect(dto.familyId).toBe("507f1f77bcf86cd799439012");
      expect(dto.createdBy).toBe("507f1f77bcf86cd799439013");
      expect(typeof dto._id).toBe("string");
      expect(typeof dto.familyId).toBe("string");
      expect(typeof dto.createdBy).toBe("string");
    });

    it("should convert dates to ISO strings", () => {
      const createdAt = new Date("2025-01-15T14:45:30.123Z");
      const updatedAt = new Date("2025-01-16T08:20:15.456Z");

      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Recipe",
        description: "Description",
        steps: ["Step"],
        tags: [],
        createdBy: new ObjectId(),
        createdAt,
        updatedAt,
      };

      const dto = toRecipeDTO(recipe);

      expect(dto.createdAt).toBe("2025-01-15T14:45:30.123Z");
      expect(dto.updatedAt).toBe("2025-01-16T08:20:15.456Z");
      expect(typeof dto.createdAt).toBe("string");
      expect(typeof dto.updatedAt).toBe("string");
    });

    it("should handle empty tags array", () => {
      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Simple Recipe",
        description: "No tags",
        steps: ["Cook"],
        tags: [],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto.tags).toEqual([]);
    });

    it("should handle multiple steps", () => {
      const steps = [
        "Prepare ingredients",
        "Mix together",
        "Cook for 30 minutes",
        "Let cool",
        "Serve",
      ];

      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Complex Recipe",
        description: "Many steps",
        steps,
        tags: ["complex"],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto.steps).toEqual(steps);
      expect(dto.steps).toHaveLength(5);
    });

    it("should handle multiple tags", () => {
      const tags = ["breakfast", "vegetarian", "quick", "healthy"];

      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Tagged Recipe",
        description: "Multiple tags",
        steps: ["Cook"],
        tags,
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto.tags).toEqual(tags);
      expect(dto.tags).toHaveLength(4);
    });

    it("should include duration when present", () => {
      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "Timer Recipe",
        description: "Has duration",
        durationMinutes: 45,
        steps: ["Bake"],
        tags: [],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto.durationMinutes).toBe(45);
    });

    it("should omit duration when not provided", () => {
      const recipe: Recipe = {
        _id: new ObjectId(),
        familyId: new ObjectId(),
        name: "No Timer",
        description: "No duration",
        steps: ["Mix"],
        tags: [],
        createdBy: new ObjectId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dto = toRecipeDTO(recipe);

      expect(dto).not.toHaveProperty("durationMinutes");
    });
  });

  describe("toRecipeDTOArray", () => {
    it("should convert array of recipes to DTOs", () => {
      const recipeId1 = new ObjectId();
      const recipeId2 = new ObjectId();
      const familyId = new ObjectId();
      const userId = new ObjectId();

      const recipes: Recipe[] = [
        {
          _id: recipeId1,
          familyId,
          name: "Recipe 1",
          description: "First recipe",
          steps: ["Step 1"],
          tags: ["tag1"],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: recipeId2,
          familyId,
          name: "Recipe 2",
          description: "Second recipe",
          steps: ["Step 2"],
          tags: ["tag2"],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const dtos = toRecipeDTOArray(recipes);

      expect(dtos).toHaveLength(2);
      expect(dtos[0]._id).toBe(recipeId1.toString());
      expect(dtos[0].name).toBe("Recipe 1");
      expect(dtos[1]._id).toBe(recipeId2.toString());
      expect(dtos[1].name).toBe("Recipe 2");
    });

    it("should handle empty array", () => {
      const dtos = toRecipeDTOArray([]);

      expect(dtos).toEqual([]);
      expect(dtos).toHaveLength(0);
    });

    it("should convert all ObjectIds to strings", () => {
      const recipes: Recipe[] = [
        {
          _id: new ObjectId("507f1f77bcf86cd799439011"),
          familyId: new ObjectId("507f1f77bcf86cd799439012"),
          name: "Recipe",
          description: "Desc",
          steps: ["Step"],
          tags: [],
          createdBy: new ObjectId("507f1f77bcf86cd799439013"),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const dtos = toRecipeDTOArray(recipes);

      expect(typeof dtos[0]._id).toBe("string");
      expect(typeof dtos[0].familyId).toBe("string");
      expect(typeof dtos[0].createdBy).toBe("string");
    });
  });
});
