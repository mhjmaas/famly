import { configureStore } from "@reduxjs/toolkit";
import type { ActivityEvent } from "@/lib/api-client";
import activitiesReducer, {
  fetchActivityEvents,
  selectActivities,
  selectActivitiesError,
  selectActivitiesLoading,
} from "@/store/slices/activities.slice";
import type { RootState } from "@/store/store";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getActivityEvents: jest.fn(),
}));

import { getActivityEvents } from "@/lib/api-client";

const mockedGetActivityEvents = getActivityEvents as jest.MockedFunction<
  typeof getActivityEvents
>;

interface TestRootState {
  activities: ReturnType<typeof activitiesReducer>;
}

describe("activities.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const mockActivityTask: ActivityEvent = {
    id: "activity-1",
    userId: "user-123",
    type: "TASK",
    title: "Complete homework",
    description: "Finished math homework",
    metadata: {},
    createdAt: "2024-01-01T10:00:00Z",
  };

  const mockActivityKarma: ActivityEvent = {
    id: "activity-2",
    userId: "user-123",
    type: "KARMA",
    title: "Karma awarded",
    description: "Bonus karma for good behavior",
    metadata: { karma: 50 },
    createdAt: "2024-01-01T11:00:00Z",
  };

  const mockActivityReward: ActivityEvent = {
    id: "activity-3",
    userId: "user-123",
    type: "REWARD",
    title: "Claimed Ice Cream",
    description: "Claimed reward for 100 karma",
    metadata: {},
    createdAt: "2024-01-01T12:00:00Z",
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        activities: activitiesReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().activities;
      expect(state.events).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeNull();
    });
  });

  describe("fetchActivityEvents async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchActivityEvents());
      const state = store.getState().activities;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set activities when fulfilled", async () => {
      const mockActivities = [
        mockActivityTask,
        mockActivityKarma,
        mockActivityReward,
      ];
      mockedGetActivityEvents.mockResolvedValueOnce(mockActivities);

      await store.dispatch(fetchActivityEvents());
      const state = store.getState().activities;

      expect(state.isLoading).toBe(false);
      expect(state.events).toEqual(mockActivities);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeTruthy();
    });

    it("should set empty array when no activities", async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([]);

      await store.dispatch(fetchActivityEvents());
      const state = store.getState().activities;

      expect(state.isLoading).toBe(false);
      expect(state.events).toEqual([]);
      expect(state.error).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch activities";
      mockedGetActivityEvents.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchActivityEvents());
      const state = store.getState().activities;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
      expect(state.events).toEqual([]);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetActivityEvents.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchActivityEvents());
      const state = store.getState().activities;

      expect(state.error).toBe("Failed to fetch activities");
    });

    it("should not pass any parameters to API", async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([]);

      await store.dispatch(fetchActivityEvents());

      // Verify getActivityEvents was called with no arguments
      expect(mockedGetActivityEvents).toHaveBeenCalledWith();
    });

    it("should update lastFetch timestamp", async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([mockActivityTask]);

      const beforeDispatch = Date.now();
      await store.dispatch(fetchActivityEvents());
      const afterDispatch = Date.now();

      const state = store.getState().activities;

      expect(state.lastFetch).toBeTruthy();
      expect(state.lastFetch).toBeGreaterThanOrEqual(beforeDispatch);
      expect(state.lastFetch).toBeLessThanOrEqual(afterDispatch);
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([
        mockActivityTask,
        mockActivityKarma,
        mockActivityReward,
      ]);
      await store.dispatch(fetchActivityEvents());
    });

    describe("selectActivities", () => {
      it("should return all activities", () => {
        const state = store.getState() as unknown as RootState;
        const activities = selectActivities(state);
        expect(activities).toHaveLength(3);
        expect(activities).toEqual([
          mockActivityTask,
          mockActivityKarma,
          mockActivityReward,
        ]);
      });

      it("should return empty array when no activities loaded", () => {
        const freshStore = configureStore({
          reducer: {
            activities: activitiesReducer,
          },
        });
        const state = freshStore.getState() as unknown as RootState;
        expect(selectActivities(state)).toEqual([]);
      });

      it("should include all activity types", () => {
        const state = store.getState() as unknown as RootState;
        const activities = selectActivities(state);

        const types = activities.map((a) => a.type);
        expect(types).toContain("TASK");
        expect(types).toContain("KARMA");
        expect(types).toContain("REWARD");
      });
    });

    describe("selectActivitiesLoading", () => {
      it("should return false after activities are loaded", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesLoading(state)).toBe(false);
      });

      it("should return true while loading", () => {
        store.dispatch(fetchActivityEvents());
        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesLoading(state)).toBe(true);
      });

      it("should return false after error", async () => {
        mockedGetActivityEvents.mockRejectedValueOnce(new Error("Test error"));
        await store.dispatch(fetchActivityEvents());
        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesLoading(state)).toBe(false);
      });
    });

    describe("selectActivitiesError", () => {
      it("should return null when no error", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesError(state)).toBeNull();
      });

      it("should return error message when fetch fails", async () => {
        const errorMessage = "Failed to fetch activities";
        mockedGetActivityEvents.mockRejectedValueOnce(new Error(errorMessage));
        await store.dispatch(fetchActivityEvents());
        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesError(state)).toBe(errorMessage);
      });

      it("should clear error on successful fetch", async () => {
        // First cause an error
        mockedGetActivityEvents.mockRejectedValueOnce(new Error("Test error"));
        await store.dispatch(fetchActivityEvents());

        // Then succeed
        mockedGetActivityEvents.mockResolvedValueOnce([mockActivityTask]);
        await store.dispatch(fetchActivityEvents());

        const state = store.getState() as unknown as RootState;
        expect(selectActivitiesError(state)).toBeNull();
      });
    });
  });

  describe("activity filtering by type", () => {
    beforeEach(async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([
        mockActivityTask,
        mockActivityKarma,
        mockActivityReward,
        { ...mockActivityTask, id: "activity-4", type: "TASK" },
      ]);
      await store.dispatch(fetchActivityEvents());
    });

    it("should have activities of different types", () => {
      const state = store.getState() as unknown as RootState;
      const activities = selectActivities(state);

      const taskActivities = activities.filter((a) => a.type === "TASK");
      const karmaActivities = activities.filter((a) => a.type === "KARMA");
      const rewardActivities = activities.filter((a) => a.type === "REWARD");

      expect(taskActivities).toHaveLength(2);
      expect(karmaActivities).toHaveLength(1);
      expect(rewardActivities).toHaveLength(1);
    });
  });

  describe("activity metadata", () => {
    beforeEach(async () => {
      mockedGetActivityEvents.mockResolvedValueOnce([mockActivityKarma]);
      await store.dispatch(fetchActivityEvents());
    });

    it("should preserve metadata in activities", () => {
      const state = store.getState() as unknown as RootState;
      const activities = selectActivities(state);

      expect(activities[0].metadata).toEqual({ karma: 50 });
    });
  });
});
