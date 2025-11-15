import { fromObjectId } from "@lib/objectid-utils";
import type {
  FamilySettings,
  FamilySettingsView,
} from "../domain/family-settings";

/**
 * Maps MongoDB family settings document to FamilySettingsView DTO
 * Omits the apiSecret from AI settings for security
 *
 * @param settings - FamilySettings document from MongoDB
 * @returns FamilySettingsView DTO (excludes apiSecret)
 */
export function toFamilySettingsView(
  settings: FamilySettings,
): FamilySettingsView {
  return {
    familyId: fromObjectId(settings.familyId),
    enabledFeatures: settings.enabledFeatures,
    aiSettings: {
      apiEndpoint: settings.aiSettings.apiEndpoint,
      modelName: settings.aiSettings.modelName,
      aiName: settings.aiSettings.aiName,
      // apiSecret is intentionally omitted for security
    },
  };
}
