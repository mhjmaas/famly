import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import { type ObjectIdString, validateObjectId } from "@lib/objectid-utils";
import {
  ALL_FEATURES,
  type FamilySettingsView,
  type UpdateFamilySettingsRequest,
} from "../domain/family-settings";
import { toFamilySettingsView } from "../lib/family-settings.mapper";
import type { FamilySettingsRepository } from "../repositories/family-settings.repository";

export class FamilySettingsService {
  constructor(private settingsRepository: FamilySettingsRepository) {}

  /**
   * Get settings for a family
   * Returns default settings (all features enabled) if no settings exist
   *
   * @param familyId - The ID of the family (string)
   * @returns Family settings view
   */
  async getSettings(familyId: string): Promise<FamilySettingsView> {
    let normalizedFamilyId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");

      logger.debug("Getting family settings", { familyId: normalizedFamilyId });

      let settings =
        await this.settingsRepository.findByFamilyId(normalizedFamilyId);

      // If no settings exist, create default settings
      if (!settings) {
        logger.info("No settings found, creating default settings", {
          familyId: normalizedFamilyId,
        });
        settings =
          await this.settingsRepository.createDefaultSettings(
            normalizedFamilyId,
          );
      }

      return toFamilySettingsView(settings);
    } catch (error) {
      logger.error("Failed to get family settings", {
        familyId: normalizedFamilyId ?? familyId,
        error,
      });
      throw error;
    }
  }

  /**
   * Update settings for a family (upsert behavior)
   *
   * @param familyId - The ID of the family (string)
   * @param input - Update settings payload
   * @returns Updated family settings view
   */
  async updateSettings(
    familyId: string,
    input: UpdateFamilySettingsRequest,
  ): Promise<FamilySettingsView> {
    let normalizedFamilyId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");

      logger.info("Updating family settings", {
        familyId: normalizedFamilyId,
        enabledFeaturesCount: input.enabledFeatures.length,
        hasAISettings: !!input.aiSettings,
      });

      // Validate that all features are valid enum values (Zod validator already checks this)
      // But we'll do an extra check here for safety
      const invalidFeatures = input.enabledFeatures.filter(
        (feature) => !ALL_FEATURES.includes(feature as any),
      );
      if (invalidFeatures.length > 0) {
        throw HttpError.badRequest(
          `Invalid feature keys: ${invalidFeatures.join(", ")}`,
        );
      }

      // TODO: Encrypt AI secret before storing
      // For now, we'll store as-is until we implement encryption
      const aiSettings = input.aiSettings
        ? {
            apiEndpoint: input.aiSettings.apiEndpoint,
            apiSecret: input.aiSettings.apiSecret, // TODO: Encrypt this
            modelName: input.aiSettings.modelName,
            aiName: input.aiSettings.aiName,
            provider: input.aiSettings.provider,
          }
        : undefined;

      const settings = await this.settingsRepository.updateSettings(
        normalizedFamilyId,
        input.enabledFeatures,
        aiSettings,
      );

      logger.info("Family settings updated successfully", {
        familyId: normalizedFamilyId,
      });

      return toFamilySettingsView(settings);
    } catch (error) {
      logger.error("Failed to update family settings", {
        familyId: normalizedFamilyId ?? familyId,
        error,
      });
      throw error;
    }
  }

  /**
   * Create default settings for a new family
   * All features enabled by default
   *
   * @param familyId - The ID of the family (string)
   * @returns Created family settings view
   */
  async createDefaultSettings(familyId: string): Promise<FamilySettingsView> {
    let normalizedFamilyId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");

      logger.info("Creating default family settings", {
        familyId: normalizedFamilyId,
      });

      const settings =
        await this.settingsRepository.createDefaultSettings(normalizedFamilyId);

      logger.info("Default family settings created successfully", {
        familyId: normalizedFamilyId,
      });

      return toFamilySettingsView(settings);
    } catch (error) {
      logger.error("Failed to create default family settings", {
        familyId: normalizedFamilyId ?? familyId,
        error,
      });
      throw error;
    }
  }
}
