import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { type Collection, ObjectId } from "mongodb";
import type {
  CreateRecipeInput,
  Recipe,
  UpdateRecipeInput,
} from "../domain/recipe";

export class RecipeRepository {
  private collection: Collection<Recipe>;

  constructor() {
    this.collection = getDb().collection<Recipe>("recipes");
  }

  /**
   * Ensure indexes are created for the recipes collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index for listing recipes by family and creation date
      await this.collection.createIndex(
        { familyId: 1, createdAt: -1 },
        { name: "idx_family_created" },
      );

      // Index for text search on name and description
      await this.collection.createIndex(
        { name: "text", description: "text" },
        { name: "idx_search" },
      );

      logger.info("Recipe indexes created successfully");
    } catch (error) {
      logger.error("Failed to create recipe indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new recipe
   */
  async create(
    familyId: ObjectId,
    input: CreateRecipeInput,
    createdBy: ObjectId,
  ): Promise<Recipe> {
    const now = new Date();

    const recipe: Recipe = {
      _id: new ObjectId(),
      familyId,
      name: input.name,
      description: input.description,
      steps: input.steps,
      tags: input.tags || [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(recipe);

    return recipe;
  }

  /**
   * Find a recipe by ID (with family scope)
   */
  async getById(
    familyId: ObjectId,
    recipeId: ObjectId,
  ): Promise<Recipe | null> {
    return this.collection.findOne({
      _id: recipeId,
      familyId,
    });
  }

  /**
   * List recipes for a family with pagination
   */
  async listByFamily(
    familyId: ObjectId,
    limit: number,
    offset: number,
  ): Promise<Recipe[]> {
    return this.collection
      .find({ familyId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  /**
   * Count total recipes for a family
   */
  async countByFamily(familyId: ObjectId): Promise<number> {
    return this.collection.countDocuments({ familyId });
  }

  /**
   * Search recipes by name and description (case-insensitive)
   */
  async search(
    familyId: ObjectId,
    query: string,
    limit: number,
    offset: number,
  ): Promise<Recipe[]> {
    return this.collection
      .find({
        familyId,
        $text: { $search: query },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .toArray();
  }

  /**
   * Count search results
   */
  async countSearch(familyId: ObjectId, query: string): Promise<number> {
    return this.collection.countDocuments({
      familyId,
      $text: { $search: query },
    });
  }

  /**
   * Update a recipe (partial)
   */
  async update(
    familyId: ObjectId,
    recipeId: ObjectId,
    input: UpdateRecipeInput,
  ): Promise<Recipe | null> {
    const updateFields: Partial<Recipe> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updateFields.name = input.name;
    }
    if (input.description !== undefined) {
      updateFields.description = input.description;
    }
    if (input.steps !== undefined) {
      updateFields.steps = input.steps;
    }
    if (input.tags !== undefined) {
      updateFields.tags = input.tags;
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: recipeId, familyId },
      { $set: updateFields },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a recipe
   */
  async delete(familyId: ObjectId, recipeId: ObjectId): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: recipeId,
      familyId,
    });
    return result.deletedCount > 0;
  }
}
