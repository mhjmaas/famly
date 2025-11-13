import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ActivityEvent } from "@/lib/api-client";
import { getActivityEvents } from "@/lib/api-client";
import type { RootState } from "../store";

interface ActivitiesState {
  events: ActivityEvent[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: ActivitiesState = {
  events: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchActivityEvents = createAsyncThunk(
  "activities/fetchActivityEvents",
  async () => {
    // No parameters needed - backend gets userId from authenticated session
    const events = await getActivityEvents();
    return { events, timestamp: Date.now() };
  },
);

// Create slice
const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {
    // Prepend a new activity event to the list (for realtime updates)
    prependActivityEvent: (state, action) => {
      state.events.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivityEvents.fulfilled, (state, action) => {
        state.events = action.payload.events;
        state.isLoading = false;
        state.lastFetch = action.payload.timestamp;
      })
      .addCase(fetchActivityEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch activities";
      });
  },
});

// Export actions
export const { prependActivityEvent } = activitiesSlice.actions;

// Export reducer
export default activitiesSlice.reducer;

// Selectors
export const selectActivities = (state: RootState) => state.activities.events;
export const selectActivitiesLoading = (state: RootState) =>
  state.activities.isLoading;
export const selectActivitiesError = (state: RootState) =>
  state.activities.error;
