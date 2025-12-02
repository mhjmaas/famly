import { ALL_FEATURES, FeatureKey } from "@famly/shared";
import type { ObjectId } from "mongodb";

// Re-export for backwards compatibility with existing code
export { FeatureKey, ALL_FEATURES };

/**
 * AI settings configuration
 */
export interface AISettings {
  apiEndpoint: string;
  apiSecret?: string; // Encrypted at rest
  modelName: string;
  aiName: string;
  provider: "LM Studio" | "Ollama";
}

/**
 * Family settings document structure in MongoDB
 */
export interface FamilySettings {
  _id: ObjectId;
  familyId: ObjectId;
  enabledFeatures: string[]; // Array of FeatureKey enum values
  aiSettings: AISettings;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Family settings view DTO
 * Used in API responses (excludes apiSecret)
 */
export interface FamilySettingsView {
  familyId: string;
  enabledFeatures: string[];
  aiSettings: {
    apiEndpoint: string;
    modelName: string;
    aiName: string;
    provider: "LM Studio" | "Ollama";
    apiSecret?: string;
  };
}

/**
 * Update family settings request payload
 */
export interface UpdateFamilySettingsRequest {
  enabledFeatures: string[];
  aiSettings?: {
    apiEndpoint: string;
    apiSecret?: string;
    modelName: string;
    aiName: string;
    provider: "LM Studio" | "Ollama";
  };
}

/**
 * Default AI settings (LM Studio for privacy-first, local-first configuration)
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  apiEndpoint: "",
  apiSecret: "",
  modelName: "",
  aiName: "Jarvis",
  provider: "LM Studio",
};
