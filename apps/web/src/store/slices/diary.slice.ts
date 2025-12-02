import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createDiaryEntry as apiCreateDiaryEntry,
  deleteDiaryEntry as apiDeleteDiaryEntry,
  updateDiaryEntry as apiUpdateDiaryEntry,
  getDiaryEntries,
} from "@/lib/api-client";
import type {
  CreateDiaryEntryRequest,
  DiaryEntry,
  UpdateDiaryEntryRequest,
} from "@/types/api.types";
import type { RootState } from "../store";

interface DiaryState {
  entries: DiaryEntry[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: DiaryState = {
  entries: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks

export const fetchDiaryEntries = createAsyncThunk(
  "diary/fetchDiaryEntries",
  async (params?: { startDate?: string; endDate?: string }) => {
    const entries = await getDiaryEntries(params?.startDate, params?.endDate);
    return { entries, timestamp: Date.now() };
  },
);

export const createDiaryEntry = createAsyncThunk(
  "diary/createDiaryEntry",
  async (data: CreateDiaryEntryRequest) => {
    const entry = await apiCreateDiaryEntry(data);
    return entry;
  },
);

export const updateDiaryEntry = createAsyncThunk(
  "diary/updateDiaryEntry",
  async ({
    entryId,
    data,
  }: {
    entryId: string;
    data: UpdateDiaryEntryRequest;
  }) => {
    const entry = await apiUpdateDiaryEntry(entryId, data);
    return entry;
  },
);

export const deleteDiaryEntry = createAsyncThunk(
  "diary/deleteDiaryEntry",
  async (entryId: string) => {
    await apiDeleteDiaryEntry(entryId);
    return entryId;
  },
);

const diarySlice = createSlice({
  name: "diary",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearEntries: (state) => {
      state.entries = [];
      state.lastFetch = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch diary entries
    builder
      .addCase(fetchDiaryEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDiaryEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload.entries;
        state.lastFetch = action.payload.timestamp;
      })
      .addCase(fetchDiaryEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch diary entries";
      });

    // Create diary entry
    builder
      .addCase(createDiaryEntry.pending, (state) => {
        state.error = null;
      })
      .addCase(createDiaryEntry.fulfilled, (state, action) => {
        // Add to beginning (newest first)
        state.entries.unshift(action.payload);
      })
      .addCase(createDiaryEntry.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create diary entry";
      });

    // Update diary entry
    builder
      .addCase(updateDiaryEntry.fulfilled, (state, action) => {
        const index = state.entries.findIndex(
          (e) => e._id === action.payload._id,
        );
        if (index !== -1) {
          state.entries[index] = action.payload;
        }
      })
      .addCase(updateDiaryEntry.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update diary entry";
      });

    // Delete diary entry
    builder
      .addCase(deleteDiaryEntry.fulfilled, (state, action) => {
        state.entries = state.entries.filter((e) => e._id !== action.payload);
      })
      .addCase(deleteDiaryEntry.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete diary entry";
      });
  },
});

export const { clearError, clearEntries } = diarySlice.actions;
export default diarySlice.reducer;

// Selectors
export const selectDiaryEntries = (state: RootState) => state.diary.entries;
export const selectDiaryLoading = (state: RootState) => state.diary.isLoading;
export const selectDiaryError = (state: RootState) => state.diary.error;
export const selectDiaryLastFetch = (state: RootState) => state.diary.lastFetch;
export const selectDiaryEntryById = (entryId: string) => (state: RootState) =>
  state.diary.entries.find((e) => e._id === entryId);
