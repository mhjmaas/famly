import { getDb } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { toObjectId } from "@lib/objectid-utils";
import { type Collection, ObjectId } from "mongodb";
import {
  ALL_FEATURES,
  DEFAULT_AI_SETTINGS,
  type FamilySettings,
} from "../domain/family-settings";

export class FamilySettingsRepository {
  private collection: Collection<FamilySettings>;

  constructor() {
    this.collection = getDb().collection<FamilySettings>("famly_settings");
  }

  /**
   * Ensure indexes are created for the familySettings collection
   * Call this during application startup
   */
  async ensureIndexes(): Promise<void> {
    try {
      // Unique index on familyId to ensure one settings doc per family
      await this.collection.createIndex(
        { familyId: 1 },
        { name: "idx_family_settings_family_id", unique: true },
      );

      logger.info("Family settings indexes created successfully");
    } catch (error) {
      logger.error("Failed to create family settings indexes:", error);
      throw error;
    }
  }

  /**
   * Find settings by family ID
   *
   * @param familyId - The family ID (string)
   * @returns The family settings document or null if not found
   */
  async findByFamilyId(familyId: string): Promise<FamilySettings | null> {
    return this.collection.findOne({ familyId: toObjectId(familyId) });
  }

  /**
   * Create default settings for a family
   * All features enabled by default, empty AI settings
   *
   * @param familyId - The family ID (string)
   * @returns The created family settings document
   */
  async createDefaultSettings(familyId: string): Promise<FamilySettings> {
    const now = new Date();

    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      enabledFeatures: [...ALL_FEATURES], // All features enabled by default
      aiSettings: { ...DEFAULT_AI_SETTINGS },
      createdAt: now,
      updatedAt: now,
    };

    await this.collection.insertOne(settings);

    return settings;
  }

  /**
   * Update family settings (upsert behavior)
   *
   * @param familyId - The family ID (string)
   * @param enabledFeatures - Array of enabled feature keys
   * @param aiSettings - Optional AI settings configuration
   * @returns The updated family settings document
   */
  async updateSettings(
    familyId: string,
    enabledFeatures: string[],
    aiSettings?: {
      apiEndpoint: string;
      apiSecret: string;
      modelName: string;
      aiName: string;
    },
  ): Promise<FamilySettings> {
    const now = new Date();

    const updateDoc: Partial<FamilySettings> = {
      enabledFeatures,
      updatedAt: now,
    };

    // Only set aiSettings in $setOnInsert if not provided in update
    const setOnInsertDoc: any = {
      _id: new ObjectId(),
      familyId: toObjectId(familyId),
      createdAt: now,
    };

    if (aiSettings !== undefined) {
      // If aiSettings provided, use them for both set and setOnInsert
      updateDoc.aiSettings = aiSettings;
    } else {
      // If no aiSettings provided, only set defaults on insert
      setOnInsertDoc.aiSettings = { ...DEFAULT_AI_SETTINGS };
    }

    const result = await this.collection.findOneAndUpdate(
      { familyId: toObjectId(familyId) },
      {
        $set: updateDoc,
        $setOnInsert: setOnInsertDoc,
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    if (!result) {
      throw new Error("Failed to update family settings");
    }

    return result;
  }

  /**
   * Delete family settings
   * Used when a family is deleted
   *
   * @param familyId - The family ID (string)
   * @returns True if deleted, false if not found
   */
  async deleteSettings(familyId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      familyId: toObjectId(familyId),
    });
    return result.deletedCount > 0;
  }
}
