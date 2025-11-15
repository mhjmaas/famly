import { FeatureKey } from "../../../src/modules/family/domain/family-settings";
import { updateFamilySettingsSchema } from "../../../src/modules/family/validators/family-settings.validator";

describe("updateFamilySettingsSchema", () => {
  describe("enabledFeatures validation", () => {
    it("should accept valid array of feature keys", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [
          FeatureKey.Tasks,
          FeatureKey.Rewards,
          FeatureKey.Diary,
        ],
      });
      expect(result.enabledFeatures).toEqual([
        FeatureKey.Tasks,
        FeatureKey.Rewards,
        FeatureKey.Diary,
      ]);
    });

    it("should accept empty array", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [],
      });
      expect(result.enabledFeatures).toEqual([]);
    });

    it("should accept all feature keys", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [
          FeatureKey.Tasks,
          FeatureKey.Rewards,
          FeatureKey.ShoppingLists,
          FeatureKey.Recipes,
          FeatureKey.Locations,
          FeatureKey.Memories,
          FeatureKey.Diary,
          FeatureKey.Chat,
          FeatureKey.AIIntegration,
        ],
      });
      expect(result.enabledFeatures).toHaveLength(9);
    });

    it("should reject invalid feature keys", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: ["invalid", "notAFeature"],
        }),
      ).toThrow();
    });

    it("should reject duplicate feature keys", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.Tasks, FeatureKey.Tasks],
        }),
      ).toThrow(/must not contain duplicates/);
    });

    it("should reject more than 9 features", () => {
      const tooManyFeatures = [
        FeatureKey.Tasks,
        FeatureKey.Rewards,
        FeatureKey.ShoppingLists,
        FeatureKey.Recipes,
        FeatureKey.Locations,
        FeatureKey.Memories,
        FeatureKey.Diary,
        FeatureKey.Chat,
        FeatureKey.AIIntegration,
        "extra" as any,
      ];
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: tooManyFeatures,
        }),
      ).toThrow();
    });

    it("should reject non-array enabledFeatures", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: "not-an-array",
        }),
      ).toThrow();
    });

    it("should reject null enabledFeatures", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: null,
        }),
      ).toThrow();
    });

    it("should reject missing enabledFeatures", () => {
      expect(() => updateFamilySettingsSchema.parse({})).toThrow();
    });
  });

  describe("aiSettings validation", () => {
    it("should accept valid AI settings", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [FeatureKey.AIIntegration],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-test123",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
      });
      expect(result.aiSettings).toEqual({
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-test123",
        modelName: "gpt-4",
        aiName: "Jarvis",
      });
    });

    it("should accept undefined aiSettings", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [FeatureKey.Tasks],
      });
      expect(result.aiSettings).toBeUndefined();
    });

    it("should reject invalid URL in apiEndpoint", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "not-a-url",
            apiSecret: "sk-test123",
            modelName: "gpt-4",
            aiName: "Jarvis",
          },
        }),
      ).toThrow(/must be a valid URL/);
    });

    it("should reject empty apiEndpoint", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "",
            apiSecret: "sk-test123",
            modelName: "gpt-4",
            aiName: "Jarvis",
          },
        }),
      ).toThrow();
    });

    it("should reject empty apiSecret", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "",
            modelName: "gpt-4",
            aiName: "Jarvis",
          },
        }),
      ).toThrow(/required/);
    });

    it("should reject empty modelName", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-test123",
            modelName: "",
            aiName: "Jarvis",
          },
        }),
      ).toThrow(/required/);
    });

    it("should reject empty aiName", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-test123",
            modelName: "gpt-4",
            aiName: "",
          },
        }),
      ).toThrow(/required/);
    });

    it("should reject partial aiSettings (missing fields)", () => {
      expect(() =>
        updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: "https://api.openai.com/v1",
            apiSecret: "sk-test123",
            // Missing modelName and aiName
          },
        }),
      ).toThrow();
    });

    it("should accept various URL formats", () => {
      const validUrls = [
        "https://api.openai.com/v1",
        "http://localhost:8080",
        "https://api.example.com:3000/v1/chat",
      ];

      for (const url of validUrls) {
        const result = updateFamilySettingsSchema.parse({
          enabledFeatures: [FeatureKey.AIIntegration],
          aiSettings: {
            apiEndpoint: url,
            apiSecret: "sk-test123",
            modelName: "gpt-4",
            aiName: "Jarvis",
          },
        });
        expect(result.aiSettings?.apiEndpoint).toBe(url);
      }
    });
  });

  describe("combined validation", () => {
    it("should accept valid payload with both features and AI settings", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [
          FeatureKey.Tasks,
          FeatureKey.Rewards,
          FeatureKey.AIIntegration,
        ],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-test123",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
      });
      expect(result.enabledFeatures).toHaveLength(3);
      expect(result.aiSettings).toBeDefined();
    });

    it("should accept empty features with AI settings", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-test123",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
      });
      expect(result.enabledFeatures).toEqual([]);
      expect(result.aiSettings).toBeDefined();
    });

    it("should ignore extra fields in request", () => {
      const result = updateFamilySettingsSchema.parse({
        enabledFeatures: [FeatureKey.Tasks],
        aiSettings: {
          apiEndpoint: "https://api.openai.com/v1",
          apiSecret: "sk-test123",
          modelName: "gpt-4",
          aiName: "Jarvis",
        },
        extraField: "should be ignored",
      });
      expect(result).not.toHaveProperty("extraField");
    });
  });
});
