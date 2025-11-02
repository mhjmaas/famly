import { HttpError } from "@lib/http-error";
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
  let familyId: ObjectId;
  let userId: ObjectId;
  let recipeId: ObjectId;

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
    familyId = new ObjectId();
    userId = new ObjectId();
    recipeId = mockRecipe._id;

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
      expect(mockRecipeRepository.create).toHaveBeenCalledWith(
        familyId,
        input,
        userId,
      );
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
      expect(mockRecipeRepository.getById).toHaveBeenCalledWith(
        familyId,
        recipeId,
      );
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
      expect(mockRecipeRepository.listByFamily).toHaveBeenCalledWith(
        familyId,
        10,
        0,
      );
      expect(mockRecipeRepository.countByFamily).toHaveBeenCalledWith(familyId);
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

      expect(mockRecipeRepository.listByFamily).toHaveBeenCalledWith(
        familyId,
        20,
        40,
      );
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
      expect(mockRecipeRepository.update).toHaveBeenCalledWith(
        familyId,
        recipeId,
        input,
      );
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

      expect(mockRecipeRepository.getById).toHaveBeenCalledWith(
        familyId,
        recipeId,
      );
    });
  });

  describe("deleteRecipe", () => {
    it("should delete a recipe successfully", async () => {
      mockRecipeRepository.getById.mockResolvedValue(mockRecipe);
      mockRecipeRepository.delete.mockResolvedValue(true);

      await service.deleteRecipe(familyId, recipeId, userId);

      expect(mockRecipeRepository.delete).toHaveBeenCalledWith(
        familyId,
        recipeId,
      );
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

      expect(mockRecipeRepository.getById).toHaveBeenCalledWith(
        familyId,
        recipeId,
      );
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
      expect(mockRecipeRepository.search).toHaveBeenCalledWith(
        familyId,
        "pasta",
        10,
        0,
      );
      expect(mockRecipeRepository.countSearch).toHaveBeenCalledWith(
        familyId,
        "pasta",
      );
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
