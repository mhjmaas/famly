import { ObjectId } from "mongodb";
import type { Recipe } from "@/modules/recipes/domain/recipe";
import { RecipeRepository } from "@/modules/recipes/repositories/recipe.repository";

// Mock logger to avoid env config errors
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the getDb function
jest.mock("@infra/mongo/client", () => ({
  getDb: jest.fn(),
}));

describe("RecipeRepository", () => {
  let repository: RecipeRepository;
  let mockCollection: any;
  let mockDb: any;
  let familyId: ObjectId;
  let userId: ObjectId;

  beforeEach(() => {
    familyId = new ObjectId();
    userId = new ObjectId();

    mockCollection = {
      insertOne: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      toArray: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      createIndex: jest.fn(),
    };

    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection),
    };

    const { getDb } = require("@infra/mongo/client");
    getDb.mockReturnValue(mockDb);

    repository = new RecipeRepository();
  });

  describe("create", () => {
    it("should create a recipe with all fields", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const input = {
        name: "Pasta Carbonara",
        description: "Classic Roman pasta",
        steps: ["Cook pasta", "Make sauce", "Combine"],
        tags: ["italian", "pasta"],
      };

      const result = await repository.create(familyId, input, userId);

      expect(result.name).toBe(input.name);
      expect(result.description).toBe(input.description);
      expect(result.steps).toEqual(input.steps);
      expect(result.tags).toEqual(input.tags);
      expect(result.familyId).toEqual(familyId);
      expect(result.createdBy).toEqual(userId);
      expect(mockCollection.insertOne).toHaveBeenCalled();
    });

    it("should create recipe without optional tags", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const input = {
        name: "Simple Recipe",
        description: "No tags",
        steps: ["Step 1"],
      };

      const result = await repository.create(familyId, input, userId);

      expect(result.name).toBe("Simple Recipe");
      expect(result.steps).toEqual(["Step 1"]);
      expect(result.tags).toEqual([]);
    });

    it("should persist duration when provided", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const input = {
        name: "Timed Recipe",
        description: "Needs 30 minutes",
        steps: ["Step"],
        durationMinutes: 30,
      };

      const result = await repository.create(familyId, input, userId);

      expect(result.durationMinutes).toBe(30);
    });

    it("should set timestamps on creation", async () => {
      mockCollection.insertOne.mockResolvedValue({});

      const beforeTime = new Date();
      const input = {
        name: "Test",
        description: "Desc",
        steps: ["Step"],
        tags: [],
      };

      const result = await repository.create(familyId, input, userId);
      const afterTime = new Date();

      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(result.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(result.updatedAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
    });
  });

  describe("getById", () => {
    it("should find recipe by ID with family scope", async () => {
      const recipeId = new ObjectId();
      const mockRecipe: Recipe = {
        _id: recipeId,
        familyId,
        name: "Test Recipe",
        description: "Desc",
        steps: ["Step"],
        tags: [],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOne.mockResolvedValue(mockRecipe);

      const result = await repository.getById(familyId, recipeId);

      expect(result).toEqual(mockRecipe);
      expect(mockCollection.findOne).toHaveBeenCalledWith({
        _id: recipeId,
        familyId,
      });
    });

    it("should return null when recipe not found", async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await repository.getById(familyId, new ObjectId());

      expect(result).toBeNull();
    });
  });

  describe("listByFamily", () => {
    it("should list recipes with pagination", async () => {
      const mockRecipes: Recipe[] = [
        {
          _id: new ObjectId(),
          familyId,
          name: "Recipe 1",
          description: "Desc 1",
          steps: ["Step 1"],
          tags: [],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: new ObjectId(),
          familyId,
          name: "Recipe 2",
          description: "Desc 2",
          steps: ["Step 2"],
          tags: [],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockRecipes);

      const result = await repository.listByFamily(familyId, 10, 0);

      expect(result).toEqual(mockRecipes);
      expect(mockCollection.find).toHaveBeenCalledWith({ familyId });
      expect(mockCollection.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockCollection.limit).toHaveBeenCalledWith(10);
      expect(mockCollection.skip).toHaveBeenCalledWith(0);
    });

    it("should handle pagination offset", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await repository.listByFamily(familyId, 10, 20);

      expect(mockCollection.skip).toHaveBeenCalledWith(20);
      expect(mockCollection.limit).toHaveBeenCalledWith(10);
    });
  });

  describe("countByFamily", () => {
    it("should count recipes for a family", async () => {
      mockCollection.countDocuments.mockResolvedValue(5);

      const result = await repository.countByFamily(familyId);

      expect(result).toBe(5);
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        familyId,
      });
    });

    it("should return 0 when no recipes exist", async () => {
      mockCollection.countDocuments.mockResolvedValue(0);

      const result = await repository.countByFamily(familyId);

      expect(result).toBe(0);
    });
  });

  describe("search", () => {
    it("should search recipes by query", async () => {
      const mockRecipes: Recipe[] = [
        {
          _id: new ObjectId(),
          familyId,
          name: "Pasta",
          description: "Italian pasta",
          steps: ["Cook"],
          tags: [],
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockRecipes);

      const result = await repository.search(familyId, "pasta", 10, 0);

      expect(result).toEqual(mockRecipes);
      expect(mockCollection.find).toHaveBeenCalledWith({
        familyId,
        $text: { $search: "pasta" },
      });
    });

    it("should apply pagination to search results", async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await repository.search(familyId, "test", 10, 30);

      expect(mockCollection.limit).toHaveBeenCalledWith(10);
      expect(mockCollection.skip).toHaveBeenCalledWith(30);
    });
  });

  describe("countSearch", () => {
    it("should count search results", async () => {
      mockCollection.countDocuments.mockResolvedValue(3);

      const result = await repository.countSearch(familyId, "pasta");

      expect(result).toBe(3);
      expect(mockCollection.countDocuments).toHaveBeenCalledWith({
        familyId,
        $text: { $search: "pasta" },
      });
    });
  });

  describe("update", () => {
    it("should update recipe with provided fields", async () => {
      const recipeId = new ObjectId();
      const updatedRecipe: Recipe = {
        _id: recipeId,
        familyId,
        name: "Updated Recipe",
        description: "Updated description",
        steps: ["New step"],
        tags: ["new-tag"],
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedRecipe);

      const input = {
        name: "Updated Recipe",
        description: "Updated description",
      };

      const result = await repository.update(familyId, recipeId, input);

      expect(result).toEqual(updatedRecipe);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalled();
    });

    it("should update only provided fields", async () => {
      const recipeId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: recipeId,
      });

      await repository.update(familyId, recipeId, { name: "New name" });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("name", "New name");
      expect(updateCall[1].$set).toHaveProperty("updatedAt");
    });

    it("should return null when recipe not found", async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await repository.update(familyId, new ObjectId(), {
        name: "Test",
      });

      expect(result).toBeNull();
    });

    it("should update steps array", async () => {
      const recipeId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: recipeId,
      });

      const newSteps = ["Step 1", "Step 2", "Step 3"];

      await repository.update(familyId, recipeId, { steps: newSteps });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("steps", newSteps);
    });

    it("should update tags array", async () => {
      const recipeId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: recipeId,
      });

      const newTags = ["breakfast", "quick"];

      await repository.update(familyId, recipeId, { tags: newTags });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("tags", newTags);
    });

    it("should set duration when provided", async () => {
      const recipeId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: recipeId,
      });

      await repository.update(familyId, recipeId, { durationMinutes: 25 });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$set).toHaveProperty("durationMinutes", 25);
      expect(updateCall[1].$unset).toBeUndefined();
    });

    it("should unset duration when null provided", async () => {
      const recipeId = new ObjectId();
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: recipeId,
      });

      await repository.update(familyId, recipeId, { durationMinutes: null });

      const updateCall = mockCollection.findOneAndUpdate.mock.calls[0];
      expect(updateCall[1].$unset).toHaveProperty("durationMinutes", "");
    });
  });

  describe("delete", () => {
    it("should delete recipe with family scope", async () => {
      const recipeId = new ObjectId();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete(familyId, recipeId);

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: recipeId,
        familyId,
      });
    });

    it("should return false when recipe not found", async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await repository.delete(familyId, new ObjectId());

      expect(result).toBe(false);
    });
  });
});
