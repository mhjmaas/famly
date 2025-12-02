import { fromObjectId } from "@lib/objectid-utils";
import type {
  FamilySettings,
  FamilySettingsView,
} from "../domain/family-settings";

/**
 * Maps MongoDB family settings document to FamilySettingsView DTO
 * IMPORTANT: Never includes apiSecret in responses for security reasons.
 * The API secret is stored on the server but never exposed to clients.
 *
 * @param settings - FamilySettings document from MongoDB
 * @returns FamilySettingsView DTO (excludes apiSecret for security)
 */
export function toFamilySettingsView(
  settings: FamilySettings,
): FamilySettingsView {
  // Never include apiSecret in the response for security
  const aiSettings = {
    apiEndpoint: settings.aiSettings.apiEndpoint,
    modelName: settings.aiSettings.modelName,
    aiName: settings.aiSettings.aiName,
    provider: settings.aiSettings.provider,
  };

  return {
    familyId: fromObjectId(settings.familyId),
    enabledFeatures: settings.enabledFeatures,
    aiSettings,
  };
}
