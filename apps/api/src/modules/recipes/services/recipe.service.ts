import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { ObjectId } from "mongodb";
import type {
  CreateRecipeInput,
  Recipe,
  UpdateRecipeInput,
} from "../domain/recipe";
import type { RecipeRepository } from "../repositories/recipe.repository";

export class RecipeService {
  constructor(
    private recipeRepository: RecipeRepository,
    private membershipRepository: FamilyMembershipRepository,
    private activityEventService?: ActivityEventService,
  ) {}

  /**
   * Create a new recipe
   */
  async createRecipe(
    familyId: ObjectId,
    userId: ObjectId,
    input: CreateRecipeInput,
  ): Promise<Recipe> {
    try {
      logger.info("Creating recipe", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        name: input.name,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Create the recipe
      const recipe = await this.recipeRepository.create(
        familyId,
        input,
        userId,
      );

      logger.info("Recipe created successfully", {
        recipeId: recipe._id.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Record activity event for recipe creation
      if (this.activityEventService) {
        try {
          await this.activityEventService.recordEvent({
            userId,
            type: "RECIPE",
            title: recipe.name,
            description: recipe.description,
          });
        } catch (error) {
          logger.error("Failed to record activity event for recipe creation", {
            recipeId: recipe._id.toString(),
            error,
          });
        }
      }

      return recipe;
    } catch (error) {
      logger.error("Failed to create recipe", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific recipe by ID
   */
  async getRecipe(
    familyId: ObjectId,
    recipeId: ObjectId,
    userId: ObjectId,
  ): Promise<Recipe> {
    try {
      logger.debug("Getting recipe by ID", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Fetch the recipe
      const recipe = await this.recipeRepository.getById(familyId, recipeId);

      if (!recipe) {
        throw HttpError.notFound("Recipe not found");
      }

      return recipe;
    } catch (error) {
      logger.error("Failed to get recipe by ID", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List recipes for a family with pagination
   */
  async listRecipes(
    familyId: ObjectId,
    userId: ObjectId,
    limit: number,
    offset: number,
  ): Promise<{ recipes: Recipe[]; total: number }> {
    try {
      logger.debug("Listing recipes for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        limit,
        offset,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Fetch recipes and total count
      const [recipes, total] = await Promise.all([
        this.recipeRepository.listByFamily(familyId, limit, offset),
        this.recipeRepository.countByFamily(familyId),
      ]);

      return { recipes, total };
    } catch (error) {
      logger.error("Failed to list recipes for family", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a recipe
   */
  async updateRecipe(
    familyId: ObjectId,
    recipeId: ObjectId,
    userId: ObjectId,
    input: UpdateRecipeInput,
  ): Promise<Recipe> {
    try {
      logger.info("Updating recipe", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify recipe exists and belongs to family
      const existingRecipe = await this.recipeRepository.getById(
        familyId,
        recipeId,
      );
      if (!existingRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      // Update the recipe
      const updatedRecipe = await this.recipeRepository.update(
        familyId,
        recipeId,
        input,
      );

      if (!updatedRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      logger.info("Recipe updated successfully", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      return updatedRecipe;
    } catch (error) {
      logger.error("Failed to update recipe", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(
    familyId: ObjectId,
    recipeId: ObjectId,
    userId: ObjectId,
  ): Promise<void> {
    try {
      logger.info("Deleting recipe", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Verify recipe exists and belongs to family
      const existingRecipe = await this.recipeRepository.getById(
        familyId,
        recipeId,
      );
      if (!existingRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      // Delete the recipe
      const deleted = await this.recipeRepository.delete(familyId, recipeId);

      if (!deleted) {
        throw HttpError.notFound("Recipe not found");
      }

      logger.info("Recipe deleted successfully", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
      });
    } catch (error) {
      logger.error("Failed to delete recipe", {
        recipeId: recipeId.toString(),
        familyId: familyId.toString(),
        userId: userId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Search recipes by name and description
   */
  async searchRecipes(
    familyId: ObjectId,
    userId: ObjectId,
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ recipes: Recipe[]; total: number }> {
    try {
      logger.debug("Searching recipes", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        query,
        limit,
        offset,
      });

      // Verify user is a member of the family
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
        membershipRepository: this.membershipRepository,
      });

      // Search recipes and count results
      const [recipes, total] = await Promise.all([
        this.recipeRepository.search(familyId, query, limit, offset),
        this.recipeRepository.countSearch(familyId, query),
      ]);

      return { recipes, total };
    } catch (error) {
      logger.error("Failed to search recipes", {
        familyId: familyId.toString(),
        userId: userId.toString(),
        query,
        error,
      });
      throw error;
    }
  }
}
