import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { ActivityEvent } from "@/lib/api-client";
import {
  getActivityEvents,
  getFamilyMemberActivityEvents,
} from "@/lib/api-client";
import type { RootState } from "../store";

interface ActivitiesState {
  events: ActivityEvent[];
  memberEvents: Record<string, ActivityEvent[]>; // memberId -> events
  isLoading: boolean;
  memberEventsLoading: Record<string, boolean>; // memberId -> loading state
  error: string | null;
  memberEventsError: Record<string, string | null>; // memberId -> error
  lastFetch: number | null;
}

const initialState: ActivitiesState = {
  events: [],
  memberEvents: {},
  isLoading: false,
  memberEventsLoading: {},
  error: null,
  memberEventsError: {},
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

export const fetchMemberActivityEvents = createAsyncThunk(
  "activities/fetchMemberActivityEvents",
  async ({
    familyId,
    memberId,
    startDate,
    endDate,
  }: {
    familyId: string;
    memberId: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const events = await getFamilyMemberActivityEvents(
      familyId,
      memberId,
      startDate,
      endDate,
    );
    return { memberId, events };
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
      })
      .addCase(fetchMemberActivityEvents.pending, (state, action) => {
        const memberId = action.meta.arg.memberId;
        state.memberEventsLoading[memberId] = true;
        state.memberEventsError[memberId] = null;
      })
      .addCase(fetchMemberActivityEvents.fulfilled, (state, action) => {
        const { memberId, events } = action.payload;
        state.memberEvents[memberId] = events;
        state.memberEventsLoading[memberId] = false;
      })
      .addCase(fetchMemberActivityEvents.rejected, (state, action) => {
        const memberId = action.meta.arg.memberId;
        state.memberEventsLoading[memberId] = false;
        state.memberEventsError[memberId] =
          action.error.message || "Failed to fetch member activities";
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

export const selectMemberActivities =
  (memberId: string) => (state: RootState) =>
    state.activities.memberEvents[memberId] || [];
export const selectMemberActivitiesLoading =
  (memberId: string) => (state: RootState) =>
    state.activities.memberEventsLoading[memberId] || false;
export const selectMemberActivitiesError =
  (memberId: string) => (state: RootState) =>
    state.activities.memberEventsError[memberId] || null;
