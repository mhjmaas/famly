import { configureStore } from "@reduxjs/toolkit";
import type {
  FamilySettings,
  UpdateFamilySettingsRequest,
} from "@/lib/api-client";
import settingsReducer, {
  ALL_FEATURES,
  clearFamilySettings,
  clearSettings,
  fetchFamilySettings,
  selectAISettings,
  selectEnabledFeatures,
  selectFamilySettings,
  selectIsFeatureEnabled,
  selectSettingsError,
  selectSettingsLoading,
  updateFamilySettingsThunk,
} from "@/store/slices/settings.slice";
import type { RootState } from "@/store/store";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getFamilySettings: jest.fn(),
  updateFamilySettings: jest.fn(),
}));

import { getFamilySettings, updateFamilySettings } from "@/lib/api-client";

const mockedGetFamilySettings = getFamilySettings as jest.MockedFunction<
  typeof getFamilySettings
>;
const mockedUpdateFamilySettings = updateFamilySettings as jest.MockedFunction<
  typeof updateFamilySettings
>;

interface TestRootState {
  settings: ReturnType<typeof settingsReducer>;
}

describe("settings.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const mockFamilySettings: FamilySettings = {
    familyId: "family-123",
    enabledFeatures: ["tasks", "rewards", "diary"],
    aiSettings: {
      apiEndpoint: "https://api.openai.com/v1",
      modelName: "gpt-4",
      aiName: "Jarvis",
    },
  };

  const mockAllFeaturesSettings: FamilySettings = {
    familyId: "family-456",
    enabledFeatures: [...ALL_FEATURES],
    aiSettings: {
      apiEndpoint: "",
      modelName: "",
      aiName: "Jarvis",
    },
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        settings: settingsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().settings;
      expect(state.settingsByFamily).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("clearSettings action", () => {
    it("should clear all family settings", () => {
      // First, add some settings
      store.dispatch(
        fetchFamilySettings.fulfilled(
          { familyId: "family-123", settings: mockFamilySettings },
          "",
          "family-123",
        ),
      );
      store.dispatch(
        fetchFamilySettings.fulfilled(
          { familyId: "family-456", settings: mockAllFeaturesSettings },
          "",
          "family-456",
        ),
      );

      expect(
        Object.keys(store.getState().settings.settingsByFamily),
      ).toHaveLength(2);

      // Clear all
      store.dispatch(clearSettings());
      const state = store.getState().settings;

      expect(state.settingsByFamily).toEqual({});
      expect(state.error).toBeNull();
    });

    it("should clear error when clearing settings", () => {
      // Set error state
      store.dispatch(
        fetchFamilySettings.rejected(new Error("Test error"), "", "family-123"),
      );
      expect(store.getState().settings.error).toBeTruthy();

      // Clear settings
      store.dispatch(clearSettings());
      expect(store.getState().settings.error).toBeNull();
    });
  });

  describe("clearFamilySettings action", () => {
    it("should clear settings for specific family only", () => {
      // Add settings for multiple families
      store.dispatch(
        fetchFamilySettings.fulfilled(
          { familyId: "family-123", settings: mockFamilySettings },
          "",
          "family-123",
        ),
      );
      store.dispatch(
        fetchFamilySettings.fulfilled(
          { familyId: "family-456", settings: mockAllFeaturesSettings },
          "",
          "family-456",
        ),
      );

      expect(
        Object.keys(store.getState().settings.settingsByFamily),
      ).toHaveLength(2);

      // Clear only family-123
      store.dispatch(clearFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.settingsByFamily["family-123"]).toBeUndefined();
      expect(state.settingsByFamily["family-456"]).toEqual(
        mockAllFeaturesSettings,
      );
    });

    it("should not throw when clearing non-existent family", () => {
      expect(() => {
        store.dispatch(clearFamilySettings("non-existent-family"));
      }).not.toThrow();
    });
  });

  describe("fetchFamilySettings async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should store settings when fulfilled", async () => {
      mockedGetFamilySettings.mockResolvedValueOnce(mockFamilySettings);

      await store.dispatch(fetchFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.isLoading).toBe(false);
      expect(state.settingsByFamily["family-123"]).toEqual(mockFamilySettings);
      expect(state.error).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch settings";
      mockedGetFamilySettings.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.isLoading).toBe(false);
      expect(state.settingsByFamily["family-123"]).toBeUndefined();
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetFamilySettings.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.error).toBe("Failed to fetch settings");
    });

    it("should handle multiple families", async () => {
      mockedGetFamilySettings
        .mockResolvedValueOnce(mockFamilySettings)
        .mockResolvedValueOnce(mockAllFeaturesSettings);

      await store.dispatch(fetchFamilySettings("family-123"));
      await store.dispatch(fetchFamilySettings("family-456"));

      const state = store.getState().settings;
      expect(state.settingsByFamily["family-123"]).toEqual(mockFamilySettings);
      expect(state.settingsByFamily["family-456"]).toEqual(
        mockAllFeaturesSettings,
      );
    });
  });

  describe("updateFamilySettingsThunk async thunk", () => {
    it("should set loading state when pending", () => {
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks"],
      };

      store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );
      const state = store.getState().settings;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should update settings when fulfilled", async () => {
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks", "rewards"],
      };

      const updatedSettings: FamilySettings = {
        familyId: "family-123",
        enabledFeatures: ["tasks", "rewards"],
        aiSettings: {
          apiEndpoint: "",
          modelName: "",
          aiName: "Jarvis",
        },
      };

      mockedUpdateFamilySettings.mockResolvedValueOnce(updatedSettings);

      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );
      const state = store.getState().settings;

      expect(state.isLoading).toBe(false);
      expect(state.settingsByFamily["family-123"]).toEqual(updatedSettings);
      expect(state.error).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to update settings";
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks"],
      };

      mockedUpdateFamilySettings.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );
      const state = store.getState().settings;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks"],
      };

      mockedUpdateFamilySettings.mockRejectedValueOnce(new Error());

      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );
      const state = store.getState().settings;

      expect(state.error).toBe("Failed to update settings");
    });

    it("should update existing settings in store", async () => {
      // First, populate with initial settings
      store.dispatch(
        fetchFamilySettings.fulfilled(
          { familyId: "family-123", settings: mockFamilySettings },
          "",
          "family-123",
        ),
      );

      // Then update
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["chat"],
      };

      const updatedSettings: FamilySettings = {
        familyId: "family-123",
        enabledFeatures: ["chat"],
        aiSettings: mockFamilySettings.aiSettings,
      };

      mockedUpdateFamilySettings.mockResolvedValueOnce(updatedSettings);

      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );

      const state = store.getState().settings;
      expect(state.settingsByFamily["family-123"]?.enabledFeatures).toEqual([
        "chat",
      ]);
    });
  });

  describe("selectors", () => {
    describe("selectSettingsLoading", () => {
      it("should return loading state", () => {
        store.dispatch(fetchFamilySettings("family-123"));
        const state = store.getState() as unknown as RootState;

        expect(selectSettingsLoading(state)).toBe(true);
      });

      it("should return false when not loading", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectSettingsLoading(state)).toBe(false);
      });
    });

    describe("selectSettingsError", () => {
      it("should return error message", async () => {
        const errorMessage = "Test error";
        mockedGetFamilySettings.mockRejectedValueOnce(new Error(errorMessage));

        await store.dispatch(fetchFamilySettings("family-123"));
        const state = store.getState() as unknown as RootState;

        expect(selectSettingsError(state)).toBe(errorMessage);
      });

      it("should return null when no error", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectSettingsError(state)).toBeNull();
      });
    });

    describe("selectEnabledFeatures", () => {
      it("should return enabled features for a family", () => {
        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-123", settings: mockFamilySettings },
            "",
            "family-123",
          ),
        );
        const state = store.getState() as unknown as RootState;

        const enabledFeatures = selectEnabledFeatures("family-123")(state);
        expect(enabledFeatures).toEqual(["tasks", "rewards", "diary"]);
      });

      it("should return all features when family not in state", () => {
        const state = store.getState() as unknown as RootState;
        const enabledFeatures = selectEnabledFeatures("non-existent-family")(
          state,
        );

        expect(enabledFeatures).toEqual(ALL_FEATURES);
      });

      it("should return all features when familyId is undefined", () => {
        const state = store.getState() as unknown as RootState;
        const enabledFeatures = selectEnabledFeatures(undefined)(state);

        expect(enabledFeatures).toEqual(ALL_FEATURES);
      });

      it("should handle empty enabled features array", () => {
        const emptySettings: FamilySettings = {
          familyId: "family-123",
          enabledFeatures: [],
          aiSettings: {
            apiEndpoint: "",
            modelName: "",
            aiName: "Jarvis",
          },
        };

        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-123", settings: emptySettings },
            "",
            "family-123",
          ),
        );
        const state = store.getState() as unknown as RootState;

        const enabledFeatures = selectEnabledFeatures("family-123")(state);
        expect(enabledFeatures).toEqual([]);
      });
    });

    describe("selectIsFeatureEnabled", () => {
      beforeEach(() => {
        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-123", settings: mockFamilySettings },
            "",
            "family-123",
          ),
        );
      });

      it("should return true for enabled feature", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectIsFeatureEnabled("family-123", "tasks")(state)).toBe(true);
        expect(selectIsFeatureEnabled("family-123", "rewards")(state)).toBe(
          true,
        );
      });

      it("should return false for disabled feature", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectIsFeatureEnabled("family-123", "chat")(state)).toBe(false);
        expect(
          selectIsFeatureEnabled("family-123", "aiIntegration")(state),
        ).toBe(false);
      });

      it("should return true by default when family not in state", () => {
        const state = store.getState() as unknown as RootState;
        expect(
          selectIsFeatureEnabled("non-existent-family", "tasks")(state),
        ).toBe(true);
      });

      it("should return true by default when familyId is undefined", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectIsFeatureEnabled(undefined, "tasks")(state)).toBe(true);
      });

      it("should handle all features enabled", () => {
        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-456", settings: mockAllFeaturesSettings },
            "",
            "family-456",
          ),
        );
        const state = store.getState() as unknown as RootState;

        for (const feature of ALL_FEATURES) {
          expect(selectIsFeatureEnabled("family-456", feature)(state)).toBe(
            true,
          );
        }
      });

      it("should handle no features enabled", () => {
        const noFeaturesSettings: FamilySettings = {
          familyId: "family-789",
          enabledFeatures: [],
          aiSettings: {
            apiEndpoint: "",
            modelName: "",
            aiName: "Jarvis",
          },
        };

        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-789", settings: noFeaturesSettings },
            "",
            "family-789",
          ),
        );
        const state = store.getState() as unknown as RootState;

        for (const feature of ALL_FEATURES) {
          expect(selectIsFeatureEnabled("family-789", feature)(state)).toBe(
            false,
          );
        }
      });
    });

    describe("selectAISettings", () => {
      it("should return AI settings for a family", () => {
        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-123", settings: mockFamilySettings },
            "",
            "family-123",
          ),
        );
        const state = store.getState() as unknown as RootState;

        const aiSettings = selectAISettings("family-123")(state);
        expect(aiSettings).toEqual({
          apiEndpoint: "https://api.openai.com/v1",
          modelName: "gpt-4",
          aiName: "Jarvis",
        });
      });

      it("should return null when family not in state", () => {
        const state = store.getState() as unknown as RootState;
        const aiSettings = selectAISettings("non-existent-family")(state);

        expect(aiSettings).toBeNull();
      });

      it("should return null when familyId is undefined", () => {
        const state = store.getState() as unknown as RootState;
        const aiSettings = selectAISettings(undefined)(state);

        expect(aiSettings).toBeNull();
      });
    });

    describe("selectFamilySettings", () => {
      it("should return full settings for a family", () => {
        store.dispatch(
          fetchFamilySettings.fulfilled(
            { familyId: "family-123", settings: mockFamilySettings },
            "",
            "family-123",
          ),
        );
        const state = store.getState() as unknown as RootState;

        const settings = selectFamilySettings("family-123")(state);
        expect(settings).toEqual(mockFamilySettings);
      });

      it("should return null when family not in state", () => {
        const state = store.getState() as unknown as RootState;
        const settings = selectFamilySettings("non-existent-family")(state);

        expect(settings).toBeNull();
      });

      it("should return null when familyId is undefined", () => {
        const state = store.getState() as unknown as RootState;
        const settings = selectFamilySettings(undefined)(state);

        expect(settings).toBeNull();
      });
    });
  });

  describe("state transitions", () => {
    it("should handle fetch -> update -> fetch sequence", async () => {
      // Initial fetch
      mockedGetFamilySettings.mockResolvedValueOnce(mockFamilySettings);
      await store.dispatch(fetchFamilySettings("family-123"));
      expect(store.getState().settings.settingsByFamily["family-123"]).toEqual(
        mockFamilySettings,
      );

      // Update
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks", "rewards", "chat"],
      };
      const updatedSettings: FamilySettings = {
        familyId: "family-123",
        enabledFeatures: ["tasks", "rewards", "chat"],
        aiSettings: mockFamilySettings.aiSettings,
      };

      mockedUpdateFamilySettings.mockResolvedValueOnce(updatedSettings);
      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );
      expect(store.getState().settings.settingsByFamily["family-123"]).toEqual(
        updatedSettings,
      );

      // Re-fetch
      mockedGetFamilySettings.mockResolvedValueOnce(updatedSettings);
      await store.dispatch(fetchFamilySettings("family-123"));
      expect(
        store.getState().settings.settingsByFamily["family-123"]
          ?.enabledFeatures,
      ).toEqual(["tasks", "rewards", "chat"]);
    });

    it("should handle clearing and re-fetching", async () => {
      // Fetch initial settings
      mockedGetFamilySettings.mockResolvedValueOnce(mockFamilySettings);
      await store.dispatch(fetchFamilySettings("family-123"));
      expect(
        store.getState().settings.settingsByFamily["family-123"],
      ).toBeDefined();

      // Clear
      store.dispatch(clearSettings());
      expect(
        store.getState().settings.settingsByFamily["family-123"],
      ).toBeUndefined();

      // Re-fetch
      mockedGetFamilySettings.mockResolvedValueOnce(mockFamilySettings);
      await store.dispatch(fetchFamilySettings("family-123"));
      expect(store.getState().settings.settingsByFamily["family-123"]).toEqual(
        mockFamilySettings,
      );
    });

    it("should handle error recovery", async () => {
      // First request fails
      mockedGetFamilySettings.mockRejectedValueOnce(new Error("Network error"));
      await store.dispatch(fetchFamilySettings("family-123"));
      expect(store.getState().settings.error).toBe("Network error");

      // Second request succeeds
      mockedGetFamilySettings.mockResolvedValueOnce(mockFamilySettings);
      await store.dispatch(fetchFamilySettings("family-123"));
      const state = store.getState().settings;

      expect(state.error).toBeNull();
      expect(state.settingsByFamily["family-123"]).toEqual(mockFamilySettings);
    });
  });

  describe("edge cases", () => {
    it("should handle updating AI settings", async () => {
      const updateRequest: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks", "aiIntegration"],
        aiSettings: {
          apiEndpoint: "https://api.anthropic.com/v1",
          apiSecret: "sk-secret",
          modelName: "claude-3",
          aiName: "Claude",
        },
      };

      const updatedSettings: FamilySettings = {
        familyId: "family-123",
        enabledFeatures: ["tasks", "aiIntegration"],
        aiSettings: {
          apiEndpoint: "https://api.anthropic.com/v1",
          modelName: "claude-3",
          aiName: "Claude",
        },
      };

      mockedUpdateFamilySettings.mockResolvedValueOnce(updatedSettings);

      await store.dispatch(
        updateFamilySettingsThunk({
          familyId: "family-123",
          settings: updateRequest,
        }),
      );

      const state = store.getState() as unknown as RootState;
      const aiSettings = selectAISettings("family-123")(state);

      expect(aiSettings?.apiEndpoint).toBe("https://api.anthropic.com/v1");
      expect(aiSettings?.modelName).toBe("claude-3");
      expect(aiSettings?.aiName).toBe("Claude");
      expect(aiSettings).not.toHaveProperty("apiSecret");
    });

    it("should handle simultaneous updates to different families", async () => {
      const update1: UpdateFamilySettingsRequest = {
        enabledFeatures: ["tasks"],
      };
      const update2: UpdateFamilySettingsRequest = {
        enabledFeatures: ["rewards"],
      };

      const settings1: FamilySettings = {
        familyId: "family-123",
        enabledFeatures: ["tasks"],
        aiSettings: { apiEndpoint: "", modelName: "", aiName: "Jarvis" },
      };

      const settings2: FamilySettings = {
        familyId: "family-456",
        enabledFeatures: ["rewards"],
        aiSettings: { apiEndpoint: "", modelName: "", aiName: "Jarvis" },
      };

      mockedUpdateFamilySettings
        .mockResolvedValueOnce(settings1)
        .mockResolvedValueOnce(settings2);

      await Promise.all([
        store.dispatch(
          updateFamilySettingsThunk({
            familyId: "family-123",
            settings: update1,
          }),
        ),
        store.dispatch(
          updateFamilySettingsThunk({
            familyId: "family-456",
            settings: update2,
          }),
        ),
      ]);

      const state = store.getState().settings;
      expect(state.settingsByFamily["family-123"]?.enabledFeatures).toEqual([
        "tasks",
      ]);
      expect(state.settingsByFamily["family-456"]?.enabledFeatures).toEqual([
        "rewards",
      ]);
    });
  });
});
