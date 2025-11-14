import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectIdString, toObjectId } from "@lib/objectid-utils";
import type { ActivityEventService } from "@modules/activity-events";
import { requireFamilyRole } from "@modules/auth/lib/require-family-role";
import { FamilyRole } from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
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
    familyId: ObjectIdString,
    userId: ObjectIdString,
    input: CreateRecipeInput,
  ): Promise<Recipe> {
    try {
      logger.info("Creating recipe", {
        familyId,
        userId,
        name: input.name,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      const familyObjectId = toObjectId(familyId, "familyId");
      const userObjectId = toObjectId(userId, "userId");

      // Create the recipe
      const recipe = await this.recipeRepository.create(
        familyObjectId,
        input,
        userObjectId,
      );

      logger.info("Recipe created successfully", {
        recipeId: recipe._id.toString(),
        familyId,
        userId,
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
        familyId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get a specific recipe by ID
   */
  async getRecipe(
    familyId: ObjectIdString,
    recipeId: ObjectIdString,
    userId: ObjectIdString,
  ): Promise<Recipe> {
    try {
      logger.debug("Getting recipe by ID", {
        recipeId,
        familyId,
        userId,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      // Fetch the recipe
      const recipe = await this.recipeRepository.getById(
        toObjectId(familyId, "familyId"),
        toObjectId(recipeId, "recipeId"),
      );

      if (!recipe) {
        throw HttpError.notFound("Recipe not found");
      }

      return recipe;
    } catch (error) {
      logger.error("Failed to get recipe by ID", {
        recipeId,
        familyId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * List recipes for a family with pagination
   */
  async listRecipes(
    familyId: ObjectIdString,
    userId: ObjectIdString,
    limit: number,
    offset: number,
  ): Promise<{ recipes: Recipe[]; total: number }> {
    try {
      logger.debug("Listing recipes for family", {
        familyId,
        userId,
        limit,
        offset,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      // Fetch recipes and total count
      const familyObjectId = toObjectId(familyId, "familyId");

      const [recipes, total] = await Promise.all([
        this.recipeRepository.listByFamily(familyObjectId, limit, offset),
        this.recipeRepository.countByFamily(familyObjectId),
      ]);

      return { recipes, total };
    } catch (error) {
      logger.error("Failed to list recipes for family", {
        familyId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update a recipe
   */
  async updateRecipe(
    familyId: ObjectIdString,
    recipeId: ObjectIdString,
    userId: ObjectIdString,
    input: UpdateRecipeInput,
  ): Promise<Recipe> {
    try {
      logger.info("Updating recipe", {
        recipeId,
        familyId,
        userId,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      // Verify recipe exists and belongs to family
      const familyObjectId = toObjectId(familyId, "familyId");
      const recipeObjectId = toObjectId(recipeId, "recipeId");

      const existingRecipe = await this.recipeRepository.getById(
        familyObjectId,
        recipeObjectId,
      );
      if (!existingRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      // Update the recipe
      const updatedRecipe = await this.recipeRepository.update(
        familyObjectId,
        recipeObjectId,
        input,
      );

      if (!updatedRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      logger.info("Recipe updated successfully", {
        recipeId,
        familyId,
        userId,
      });

      return updatedRecipe;
    } catch (error) {
      logger.error("Failed to update recipe", {
        recipeId,
        familyId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a recipe
   */
  async deleteRecipe(
    familyId: ObjectIdString,
    recipeId: ObjectIdString,
    userId: ObjectIdString,
  ): Promise<void> {
    try {
      logger.info("Deleting recipe", {
        recipeId,
        familyId,
        userId,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      // Verify recipe exists and belongs to family
      const familyObjectId = toObjectId(familyId, "familyId");
      const recipeObjectId = toObjectId(recipeId, "recipeId");

      const existingRecipe = await this.recipeRepository.getById(
        familyObjectId,
        recipeObjectId,
      );
      if (!existingRecipe) {
        throw HttpError.notFound("Recipe not found");
      }

      // Delete the recipe
      const deleted = await this.recipeRepository.delete(
        familyObjectId,
        recipeObjectId,
      );

      if (!deleted) {
        throw HttpError.notFound("Recipe not found");
      }

      logger.info("Recipe deleted successfully", {
        recipeId,
        familyId,
        userId,
      });
    } catch (error) {
      logger.error("Failed to delete recipe", {
        recipeId,
        familyId,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Search recipes by name and description
   */
  async searchRecipes(
    familyId: ObjectIdString,
    userId: ObjectIdString,
    query: string,
    limit: number,
    offset: number,
  ): Promise<{ recipes: Recipe[]; total: number }> {
    try {
      logger.debug("Searching recipes", {
        familyId,
        userId,
        query,
        limit,
        offset,
      });

      // Verify user is a member of the family
      await this.ensureFamilyMembership(familyId, userId, [
        FamilyRole.Parent,
        FamilyRole.Child,
      ]);

      // Search recipes and count results
      const familyObjectId = toObjectId(familyId, "familyId");

      const [recipes, total] = await Promise.all([
        this.recipeRepository.search(familyObjectId, query, limit, offset),
        this.recipeRepository.countSearch(familyObjectId, query),
      ]);

      return { recipes, total };
    } catch (error) {
      logger.error("Failed to search recipes", {
        familyId,
        userId,
        query,
        error,
      });
      throw error;
    }
  }

  private async ensureFamilyMembership(
    familyId: ObjectIdString,
    userId: ObjectIdString,
    allowedRoles: FamilyRole[],
  ): Promise<void> {
    await requireFamilyRole({
      familyId,
      userId,
      allowedRoles,
      membershipRepository: this.membershipRepository,
    });
  }
}
