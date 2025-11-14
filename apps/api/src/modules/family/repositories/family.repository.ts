import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId, toObjectIdArray } from "@lib/objectid-utils";
import { type Collection, ObjectId } from "mongodb";
import type { Family } from "../domain/family";

export class FamilyRepository {
  private collection: Collection<Family>;

  constructor() {
    this.collection = getDb().collection<Family>("families");
  }

  /**
   * Ensure indexes are created for the families collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Index on creatorId for listing families created by a user
      await this.collection.createIndex(
        { creatorId: 1 },
        { name: "idx_creator_families" },
      );

      // Non-unique index on name for future case-insensitive search
      await this.collection.createIndex(
        { name: 1 },
        { name: "idx_family_name" },
      );

      logger.info("Family indexes created successfully");
    } catch (error) {
      logger.error("Failed to create family indexes:", error);
      throw error;
    }
  }

  /**
   * Create a new family
   *
   * @param creatorId - The user ID of the family creator (string)
   * @param name - Optional family name (normalized)
   * @returns The created family document
   */
  async createFamily(creatorId: string, name: string | null): Promise<Family> {
    const now = new Date();

    const family: Family = {
      _id: new ObjectId(),
      name,
      creatorId: toObjectId(creatorId),
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(family);

    return family;
  }

  /**
   * Find a family by ID
   *
   * @param familyId - The family ID (string)
   * @returns The family document or null if not found
   */
  async findById(familyId: string): Promise<Family | null> {
    return this.collection.findOne({ _id: toObjectId(familyId) });
  }

  /**
   * Find families by IDs
   * Useful for batch lookups when fetching membership views
   *
   * @param familyIds - Array of family IDs (strings)
   * @returns Array of family documents
   */
  async findByIds(familyIds: string[]): Promise<Family[]> {
    return this.collection
      .find({ _id: { $in: toObjectIdArray(familyIds) } })
      .toArray();
  }

  /**
   * Find families created by a user
   *
   * @param creatorId - The user ID (string)
   * @returns Array of family documents
   */
  async findByCreator(creatorId: string): Promise<Family[]> {
    return this.collection
      .find({ creatorId: toObjectId(creatorId) })
      .sort({ createdAt: -1 })
      .toArray();
  }

  /**
   * Update a family name
   *
   * @param familyId - The family ID (string)
   * @param name - New family name (normalized)
   * @returns The updated family document or null if not found
   */
  async updateName(
    familyId: string,
    name: string | null,
  ): Promise<Family | null> {
    const result = await this.collection.findOneAndUpdate(
      { _id: toObjectId(familyId) },
      {
        $set: {
          name,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    return result || null;
  }

  /**
   * Delete a family
   *
   * @param familyId - The family ID (string)
   * @returns True if deleted, false if not found
   */
  async deleteFamily(familyId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: toObjectId(familyId),
    });
    return result.deletedCount > 0;
  }
}
