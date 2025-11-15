import { ObjectId } from "mongodb";
import type { FamilySettings } from "../../../src/modules/family/domain/family-settings";
import { FeatureKey } from "../../../src/modules/family/domain/family-settings";
import { toFamilySettingsView } from "../../../src/modules/family/lib/family-settings.mapper";

describe("toFamilySettingsView", () => {
  it("should map FamilySettings to FamilySettingsView", () => {
    const familyId = new ObjectId();
    const createdAt = new Date("2024-01-01T00:00:00.000Z");
    const updatedAt = new Date("2024-01-02T00:00:00.000Z");

    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId,
      enabledFeatures: [FeatureKey.Tasks, FeatureKey.Rewards, FeatureKey.Diary],
      aiSettings: {
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-secret-key-should-not-appear",
        modelName: "gpt-4",
        aiName: "Jarvis",
      },
      createdAt,
      updatedAt,
    };

    const result = toFamilySettingsView(settings);

    expect(result.familyId).toBe(familyId.toString());
    expect(result.enabledFeatures).toEqual([
      FeatureKey.Tasks,
      FeatureKey.Rewards,
      FeatureKey.Diary,
    ]);
    expect(result.aiSettings.apiEndpoint).toBe("https://api.openai.com/v1");
    expect(result.aiSettings.modelName).toBe("gpt-4");
    expect(result.aiSettings.aiName).toBe("Jarvis");
  });

  it("should omit apiSecret from response", () => {
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
      enabledFeatures: [FeatureKey.Tasks],
      aiSettings: {
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-secret-should-not-be-in-response",
        modelName: "gpt-4",
        aiName: "Jarvis",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(result.aiSettings).not.toHaveProperty("apiSecret");
    expect(Object.keys(result.aiSettings)).toEqual([
      "apiEndpoint",
      "modelName",
      "aiName",
    ]);
  });

  it("should handle empty enabled features array", () => {
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
      enabledFeatures: [],
      aiSettings: {
        apiEndpoint: "",
        apiSecret: "",
        modelName: "",
        aiName: "Jarvis",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(result.enabledFeatures).toEqual([]);
  });

  it("should handle all features enabled", () => {
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
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
      aiSettings: {
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-secret",
        modelName: "gpt-4",
        aiName: "Jarvis",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(result.enabledFeatures).toHaveLength(9);
    expect(result.enabledFeatures).toContain(FeatureKey.Tasks);
    expect(result.enabledFeatures).toContain(FeatureKey.AIIntegration);
  });

  it("should preserve familyId as string", () => {
    const familyId = new ObjectId();
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId,
      enabledFeatures: [FeatureKey.Tasks],
      aiSettings: {
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-secret",
        modelName: "gpt-4",
        aiName: "Jarvis",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(typeof result.familyId).toBe("string");
    expect(result.familyId).toBe(familyId.toString());
  });

  it("should handle empty AI settings fields", () => {
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
      enabledFeatures: [FeatureKey.Tasks],
      aiSettings: {
        apiEndpoint: "",
        apiSecret: "",
        modelName: "",
        aiName: "",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(result.aiSettings.apiEndpoint).toBe("");
    expect(result.aiSettings.modelName).toBe("");
    expect(result.aiSettings.aiName).toBe("");
    expect(result.aiSettings).not.toHaveProperty("apiSecret");
  });

  it("should not include createdAt or updatedAt in view", () => {
    const settings: FamilySettings = {
      _id: new ObjectId(),
      familyId: new ObjectId(),
      enabledFeatures: [FeatureKey.Tasks],
      aiSettings: {
        apiEndpoint: "https://api.openai.com/v1",
        apiSecret: "sk-secret",
        modelName: "gpt-4",
        aiName: "Jarvis",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toFamilySettingsView(settings);

    expect(result).not.toHaveProperty("_id");
    expect(result).not.toHaveProperty("createdAt");
    expect(result).not.toHaveProperty("updatedAt");
  });
});
