import { HttpError } from "@lib/http-error";
import { fromObjectId, type ObjectIdString } from "@lib/objectid-utils";
import { ObjectId } from "mongodb";
import { FamilyRole } from "@/modules/family/domain/family";
import type { Recipe } from "@/modules/recipes/domain/recipe";
import { RecipeService } from "@/modules/recipes/services/recipe.service";

// Mock dependencies
jest.mock("@lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@modules/auth/lib/require-family-role", () => ({
  requireFamilyRole: jest.fn(),
}));

import { requireFamilyRole } from "@modules/auth/lib/require-family-role";

describe("RecipeService", () => {
  let service: RecipeService;
  let mockRecipeRepository: any;
  let mockMembershipRepository: any;
  let familyId: ObjectIdString;
  let userId: ObjectIdString;
  let recipeId: ObjectIdString;

  const mockRecipe: Recipe = {
    _id: new ObjectId(),
    familyId: new ObjectId(),
    name: "Pasta Carbonara",
    description: "Classic Roman pasta",
    steps: ["Cook pasta", "Make sauce", "Combine"],
    tags: ["italian", "pasta"],
    createdBy: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    familyId = fromObjectId(new ObjectId());
    userId = fromObjectId(new ObjectId());
    recipeId = fromObjectId(mockRecipe._id);

    mockRecipeRepository = {
      create: jest.fn(),
      getById: jest.fn(),
      listByFamily: jest.fn(),
      countByFamily: jest.fn(),
      search: jest.fn(),
      countSearch: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    mockMembershipRepository = {};

    service = new RecipeService(mockRecipeRepository, mockMembershipRepository);

    // Mock requireFamilyRole to succeed by default
    (requireFamilyRole as jest.Mock).mockResolvedValue(undefined);
  });

  describe("createRecipe", () => {
    it("should create a recipe successfully", async () => {
      mockRecipeRepository.create.mockResolvedValue(mockRecipe);

      const input = {
        name: "Pasta Carbonara",
        description: "Classic Roman pasta",
        steps: ["Cook pasta", "Make sauce", "Combine"],
        tags: ["italian", "pasta"],
      };

      const result = await service.createRecipe(familyId, userId, input);

      expect(result).toEqual(mockRecipe);
      expect(requireFamilyRole).toHaveBeenCalledWith({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: mockMembershipRepository,
      });
      const createArgs = mockRecipeRepository.create.mock.calls[0];
      expect(createArgs[0].toHexString()).toBe(familyId);
      expect(createArgs[1]).toBe(input);
      expect(createArgs[2].toHexString()).toBe(userId);
    });

    it("should throw error when user is not a family member", async () => {
      (requireFamilyRole as jest.Mock).mockRejectedValueOnce(
        HttpError.forbidden("Not a family member"),
      );

      const input = {
        name: "Recipe",
        description: "Desc",
        steps: ["Step"],
      };

      await expect(
        service.createRecipe(familyId, userId, input),
      ).rejects.toThrow();
      expect(mockRecipeRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("getRecipe", () => {
    it("should get a recipe successfully", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);

      const result = await service.getRecipe(familyId, recipeId, userId);

      expect(result).toEqual(mockRecipe);
      const getArgs = mockRecipeRepository.getById.mock.calls[0];
      expect(getArgs[0].toHexString()).toBe(familyId);
      expect(getArgs[1].toHexString()).toBe(recipeId);
    });

    it("should throw not found when recipe does not exist", async () => {
      mockRecipeRepository.getById.mockResolvedValue(null);

      await expect(
        service.getRecipe(familyId, recipeId, userId),
      ).rejects.toThrow(HttpError.notFound("Recipe not found"));
    });

    it("should verify family membership", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);

      await service.getRecipe(familyId, recipeId, userId);

      expect(requireFamilyRole).toHaveBeenCalledWith({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: mockMembershipRepository,
      });
    });
  });

  describe("listRecipes", () => {
    it("should list recipes with pagination", async () => {
      const recipes = [mockRecipe];
      mockRecipeRepository.listByFamily.mockResolvedValue(recipes);
      mockRecipeRepository.countByFamily.mockResolvedValue(5);

      const result = await service.listRecipes(familyId, userId, 10, 0);

      expect(result.recipes).toEqual(recipes);
      expect(result.total).toBe(5);
      const listArgs = mockRecipeRepository.listByFamily.mock.calls[0];
      expect(listArgs[0].toHexString()).toBe(familyId);
      expect(listArgs[1]).toBe(10);
      expect(listArgs[2]).toBe(0);
      const countArgs = mockRecipeRepository.countByFamily.mock.calls[0][0];
      expect(countArgs.toHexString()).toBe(familyId);
    });

    it("should return empty list when no recipes exist", async () => {
      mockRecipeRepository.listByFamily.mockResolvedValue([]);
      mockRecipeRepository.countByFamily.mockResolvedValue(0);

      const result = await service.listRecipes(familyId, userId, 10, 0);

      expect(result.recipes).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should handle custom pagination parameters", async () => {
      mockRecipeRepository.listByFamily.mockResolvedValue([]);
      mockRecipeRepository.countByFamily.mockResolvedValue(0);

      await service.listRecipes(familyId, userId, 20, 40);

      const paginationArgs = mockRecipeRepository.listByFamily.mock.calls[0];
      expect(paginationArgs[0].toHexString()).toBe(familyId);
      expect(paginationArgs[1]).toBe(20);
      expect(paginationArgs[2]).toBe(40);
    });
  });

  describe("updateRecipe", () => {
    it("should update a recipe successfully", async () => {
      const updatedRecipe = {
        ...mockRecipe,
        name: "Updated Name",
      };

      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue(updatedRecipe);

      const input = { name: "Updated Name" };

      const result = await service.updateRecipe(
        familyId,
        recipeId,
        userId,
        input,
      );

      expect(result).toEqual(updatedRecipe);
      const updateArgs = mockRecipeRepository.update.mock.calls[0];
      expect(updateArgs[0].toHexString()).toBe(familyId);
      expect(updateArgs[1].toHexString()).toBe(recipeId);
      expect(updateArgs[2]).toBe(input);
    });

    it("should throw not found when recipe does not exist", async () => {
      mockRecipeRepository.getById.mockResolvedValue(null);

      const input = { name: "Updated Name" };

      await expect(
        service.updateRecipe(familyId, recipeId, userId, input),
      ).rejects.toThrow(HttpError.notFound("Recipe not found"));
      expect(mockRecipeRepository.update).not.toHaveBeenCalled();
    });

    it("should verify recipe exists before updating", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);
      mockRecipeRepository.update.mockResolvedValue(mockRecipe);

      await service.updateRecipe(familyId, recipeId, userId, { name: "New" });

      const getArgs = mockRecipeRepository.getById.mock.calls[0];
      expect(getArgs[0].toHexString()).toBe(familyId);
      expect(getArgs[1].toHexString()).toBe(recipeId);
    });
  });

  describe("deleteRecipe", () => {
    it("should delete a recipe successfully", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);
      mockRecipeRepository.delete.mockResolvedValue(true);

      await service.deleteRecipe(familyId, recipeId, userId);

      const deleteArgs = mockRecipeRepository.delete.mock.calls[0];
      expect(deleteArgs[0].toHexString()).toBe(familyId);
      expect(deleteArgs[1].toHexString()).toBe(recipeId);
    });

    it("should throw not found when recipe does not exist", async () => {
      mockRecipeRepository.getById.mockResolvedValue(null);

      await expect(
        service.deleteRecipe(familyId, recipeId, userId),
      ).rejects.toThrow(HttpError.notFound("Recipe not found"));
      expect(mockRecipeRepository.delete).not.toHaveBeenCalled();
    });

    it("should verify recipe exists before deleting", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);
      mockRecipeRepository.delete.mockResolvedValue(true);

      await service.deleteRecipe(familyId, recipeId, userId);

      const deleteGetArgs = mockRecipeRepository.getById.mock.calls[0];
      expect(deleteGetArgs[0].toHexString()).toBe(familyId);
      expect(deleteGetArgs[1].toHexString()).toBe(recipeId);
    });
  });

  describe("searchRecipes", () => {
    it("should search recipes successfully", async () => {
      const recipes = [mockRecipe];
      mockRecipeRepository.search.mockResolvedValue(recipes);
      mockRecipeRepository.countSearch.mockResolvedValue(1);

      const result = await service.searchRecipes(
        familyId,
        userId,
        "pasta",
        10,
        0,
      );

      expect(result.recipes).toEqual(recipes);
      expect(result.total).toBe(1);
      const searchArgs = mockRecipeRepository.search.mock.calls[0];
      expect(searchArgs[0].toHexString()).toBe(familyId);
      expect(searchArgs[1]).toBe("pasta");
      expect(searchArgs[2]).toBe(10);
      expect(searchArgs[3]).toBe(0);
      const countSearchArgs = mockRecipeRepository.countSearch.mock.calls[0];
      expect(countSearchArgs[0].toHexString()).toBe(familyId);
      expect(countSearchArgs[1]).toBe("pasta");
    });

    it("should return empty results when no matches", async () => {
      mockRecipeRepository.search.mockResolvedValue([]);
      mockRecipeRepository.countSearch.mockResolvedValue(0);

      const result = await service.searchRecipes(
        familyId,
        userId,
        "nonexistent",
        10,
        0,
      );

      expect(result.recipes).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("should verify family membership before searching", async () => {
      mockRecipeRepository.search.mockResolvedValue([]);
      mockRecipeRepository.countSearch.mockResolvedValue(0);

      await service.searchRecipes(familyId, userId, "test", 10, 0);

      expect(requireFamilyRole).toHaveBeenCalledWith({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: mockMembershipRepository,
      });
    });
  });
});
