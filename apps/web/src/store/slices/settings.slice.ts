import { ALL_FEATURES, type Feature } from "@famly/shared";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type FamilySettings,
  getFamilySettings,
  type UpdateFamilySettingsRequest,
  updateFamilySettings,
} from "@/lib/api-client";
import type { RootState } from "../store";

// Re-export for backwards compatibility
export type FeatureKey = Feature;
export { ALL_FEATURES };

interface SettingsState {
  settingsByFamily: Record<string, FamilySettings | undefined>;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settingsByFamily: {},
  isLoading: false,
  error: null,
};

// Async thunk for fetching family settings
export const fetchFamilySettings = createAsyncThunk(
  "settings/fetchFamilySettings",
  async (familyId: string) => {
    const settings = await getFamilySettings(familyId);
    return { familyId, settings };
  },
);

// Async thunk for updating family settings
export const updateFamilySettingsThunk = createAsyncThunk(
  "settings/updateFamilySettings",
  async ({
    familyId,
    settings,
  }: {
    familyId: string;
    settings: UpdateFamilySettingsRequest;
  }) => {
    const updatedSettings = await updateFamilySettings(familyId, settings);
    return { familyId, settings: updatedSettings };
  },
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    clearSettings: (state) => {
      state.settingsByFamily = {};
      state.error = null;
    },
    clearFamilySettings: (state, action: PayloadAction<string>) => {
      delete state.settingsByFamily[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchFamilySettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamilySettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settingsByFamily[action.payload.familyId] =
          action.payload.settings;
      })
      .addCase(fetchFamilySettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch settings";
      })
      // Update settings
      .addCase(updateFamilySettingsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFamilySettingsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settingsByFamily[action.payload.familyId] =
          action.payload.settings;
      })
      .addCase(updateFamilySettingsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to update settings";
      });
  },
});

export const { clearSettings, clearFamilySettings } = settingsSlice.actions;
export default settingsSlice.reducer;

// Selectors
export const selectSettingsLoading = (state: RootState) =>
  state.settings.isLoading;
export const selectSettingsError = (state: RootState) => state.settings.error;

/**
 * Select enabled features for a family
 * Returns all features by default if settings not loaded
 */
export const selectEnabledFeatures = (familyId: string | undefined) => {
  return (state: RootState): string[] => {
    if (!familyId) return ALL_FEATURES as unknown as string[];
    return (
      state.settings.settingsByFamily[familyId]?.enabledFeatures ||
      (ALL_FEATURES as unknown as string[])
    );
  };
};

/**
 * Check if a specific feature is enabled for a family
 * Returns true by default if settings not loaded
 */
export const selectIsFeatureEnabled = (
  familyId: string | undefined,
  feature: string,
) => {
  return (state: RootState): boolean => {
    if (!familyId) return true;
    const settings = state.settings.settingsByFamily[familyId];
    return settings?.enabledFeatures.includes(feature) ?? true;
  };
};

/**
 * Select AI settings for a family
 */
export const selectAISettings = (familyId: string | undefined) => {
  return (state: RootState) => {
    if (!familyId) return null;
    return state.settings.settingsByFamily[familyId]?.aiSettings || null;
  };
};

/**
 * Select all settings for a family
 */
export const selectFamilySettings = (familyId: string | undefined) => {
  return (state: RootState): FamilySettings | null => {
    if (!familyId) return null;
    return state.settings.settingsByFamily[familyId] || null;
  };
};
