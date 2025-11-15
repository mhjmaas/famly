import { ObjectId } from "mongodb";
import { HttpError } from "../../../src/lib/http-error";
import { fromObjectId } from "../../../src/lib/objectid-utils";
import {
  ALL_FEATURES,
  DEFAULT_AI_SETTINGS,
  type FamilySettings,
  FeatureKey,
} from "../../../src/modules/family/domain/family-settings";
import type { FamilySettingsRepository } from "../../../src/modules/family/repositories/family-settings.repository";
import { FamilySettingsService } from "../../../src/modules/family/services/family-settings.service";

// Mock logger
jest.mock("../../../src/lib/logger", () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe("FamilySettingsService", () => {
  let service: FamilySettingsService;
  let mockRepository: jest.Mocked<FamilySettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      ensureIndexes: jest.fn(),
      findByFamilyId: jest.fn(),
      createDefaultSettings: jest.fn(),
      updateSettings: jest.fn(),
      deleteSettings: jest.fn(),
    } as unknown as jest.Mocked<FamilySettingsRepository>;

    service = new FamilySettingsService(mockRepository);
  });

  describe("getSettings", () => {
    it("should return existing settings", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const settings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-secret",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByFamilyId.mockResolvedValue(settings);

      const result = await service.getSettings(familyId);

      expect(mockRepository.findByFamilyId).toHaveBeenCalledWith(familyId);
      expect(result.familyId).toBe(familyId);
      expect(result.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
      ]);
      expect(result.aiSettings.apiEndpoint).toBe("https://api.openai.com/v1");
      expect(result.aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should create and return default settings if none exist", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const defaultSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [...ALL_FEATURES],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByFamilyId.mockResolvedValue(null);
      mockRepository.createDefaultSettings.mockResolvedValue(defaultSettings);

      const result = await service.getSettings(familyId);

      expect(mockRepository.findByFamilyId).toHaveBeenCalledWith(familyId);
      expect(mockRepository.createDefaultSettings).toHaveBeenCalledWith(
        familyId,
      );
      expect(result.enabledFeatures).toHaveLength(9);
      expect(result.enabledFeatures).toContain(FeatureKey.Tasks);
      expect(result.enabledFeatures).toContain(FeatureKey.AIIntegration);
    });

    it("should throw error for invalid familyId format", async () => {
      await expect(service.getSettings("invalid-id")).rejects.toThrow(
        HttpError,
      );

      expect(mockRepository.findByFamilyId).not.toHaveBeenCalled();
    });

    it("should handle repository errors", async () => {
      const familyId = fromObjectId(new ObjectId());
      const error = new Error("Database error");

      mockRepository.findByFamilyId.mockRejectedValue(error);

      await expect(service.getSettings(familyId)).rejects.toThrow(error);
    });
  });

  describe("updateSettings", () => {
    it("should update settings with valid data", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const input = {
        enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-new-secret",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
      };

      const updatedSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: input.enabledFeatures,
        aiSettings: input.aiSettings,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.updateSettings.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(familyId, input);

      expect(mockRepository.updateSettings).toHaveBeenCalledWith(
        familyId,
        input.enabledFeatures,
        input.aiSettings,
      );
      expect(result.familyId).toBe(familyId);
      expect(result.enabledFeatures).toEqual(input.enabledFeatures);
      expect(result.aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should update settings without AI settings", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const input = {
        enabledFeatures: [FeatureKey.Tasks],
      };

      const updatedSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: input.enabledFeatures,
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.updateSettings.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(familyId, input);

      expect(mockRepository.updateSettings).toHaveBeenCalledWith(
        familyId,
        input.enabledFeatures,
        undefined,
      );
      expect(result.enabledFeatures).toEqual([FeatureKey.Tasks]);
    });

    it("should accept empty enabled features array", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const input = {
        enabledFeatures: [],
      };

      const updatedSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.updateSettings.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(familyId, input);

      expect(result.enabledFeatures).toEqual([]);
    });

    it("should accept all features enabled", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const input = {
        enabledFeatures: [...ALL_FEATURES],
      };

      const updatedSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [...ALL_FEATURES],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.updateSettings.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(familyId, input);

      expect(result.enabledFeatures).toHaveLength(9);
    });

    it("should throw error for invalid feature keys", async () => {
      const familyId = fromObjectId(new ObjectId());
      const input = {
        enabledFeatures: ["invalid-feature", "another-invalid"] as any[],
      };

      await expect(service.updateSettings(familyId, input)).rejects.toThrow(
        HttpError,
      );
      await expect(service.updateSettings(familyId, input)).rejects.toThrow(
        /Invalid feature keys/,
      );

      expect(mockRepository.updateSettings).not.toHaveBeenCalled();
    });

    it("should throw error for invalid familyId format", async () => {
      const input = {
        enabledFeatures: [FeatureKey.Tasks],
      };

      await expect(service.updateSettings("invalid-id", input)).rejects.toThrow(
        HttpError,
      );

      expect(mockRepository.updateSettings).not.toHaveBeenCalled();
    });

    it("should handle repository errors during update", async () => {
      const familyId = fromObjectId(new ObjectId());
      const input = {
        enabledFeatures: [FeatureKey.Tasks],
      };
      const error = new Error("Database update failed");

      mockRepository.updateSettings.mockRejectedValue(error);

      await expect(service.updateSettings(familyId, input)).rejects.toThrow(
        error,
      );
    });

    it("should validate feature keys even if they pass type checking", async () => {
      const familyId = fromObjectId(new ObjectId());
      const input = {
        enabledFeatures: [
          FeatureKey.Tasks,
          "notInEnum" as any,
          FeatureKey.Rewards,
        ],
      };

      await expect(service.updateSettings(familyId, input)).rejects.toThrow(
        HttpError,
      );
      await expect(service.updateSettings(familyId, input)).rejects.toThrow(
        /Invalid feature keys/,
      );
    });
  });

  describe("createDefaultSettings", () => {
    it("should create default settings for a family", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const defaultSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [...ALL_FEATURES],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.createDefaultSettings.mockResolvedValue(defaultSettings);

      const result = await service.createDefaultSettings(familyId);

      expect(mockRepository.createDefaultSettings).toHaveBeenCalledWith(
        familyId,
      );
      expect(result.familyId).toBe(familyId);
      expect(result.enabledFeatures).toHaveLength(9);
      expect(result.enabledFeatures).toContain(FeatureKey.Tasks);
      expect(result.enabledFeatures).toContain(FeatureKey.Rewards);
      expect(result.enabledFeatures).toContain(FeatureKey.AIIntegration);
      expect(result.aiSettings.aiName).toBe("Jarvis");
      expect(result.aiSettings.apiEndpoint).toBe("");
    });

    it("should not include apiSecret in response", async () => {
      const familyId = fromObjectId(new ObjectId());
      const familyObjectId = new ObjectId(familyId);
      const defaultSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [...ALL_FEATURES],
        aiSettings: {
          apiEndpoint: "",
          apiSecret: "should-not-appear",
          modelName: "",
          aiName: "Jarvis",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.createDefaultSettings.mockResolvedValue(defaultSettings);

      const result = await service.createDefaultSettings(familyId);

      expect(result.aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should throw error for invalid familyId format", async () => {
      await expect(service.createDefaultSettings("invalid-id")).rejects.toThrow(
        HttpError,
      );

      expect(mockRepository.createDefaultSettings).not.toHaveBeenCalled();
    });

    it("should handle repository errors during creation", async () => {
      const familyId = fromObjectId(new ObjectId());
      const error = new Error("Database creation failed");

      mockRepository.createDefaultSettings.mockRejectedValue(error);

      await expect(service.createDefaultSettings(familyId)).rejects.toThrow(
        error,
      );
    });
  });

  describe("edge cases", () => {
    it("should handle very long familyId ObjectId string", async () => {
      const familyId = new ObjectId().toString();
      const familyObjectId = new ObjectId(familyId);
      const settings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [FeatureKey.Tasks],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByFamilyId.mockResolvedValue(settings);

      const result = await service.getSettings(familyId);

      expect(result.familyId).toBe(familyId);
    });

    it("should handle settings with single feature", async () => {
      const familyId = fromObjectId(new ObjectId());
      const input = {
        enabledFeatures: [FeatureKey.Chat],
      };

      const familyObjectId = new ObjectId(familyId);
      const updatedSettings: FamilySettings = {
        _id: new ObjectId(),
        familyId: familyObjectId,
        enabledFeatures: [FeatureKey.Chat],
        aiSettings: { ...DEFAULT_AI_SETTINGS },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.updateSettings.mockResolvedValue(updatedSettings);

      const result = await service.updateSettings(familyId, input);

      expect(result.enabledFeatures).toEqual([FeatureKey.Chat]);
    });
  });
});
