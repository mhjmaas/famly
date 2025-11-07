import { configureStore } from "@reduxjs/toolkit";
import rewardsReducer, {
  createReward,
  deleteReward,
  fetchRewards,
  selectFavouritedRewards,
  selectRewardById,
  selectRewards,
  selectRewardsError,
  selectRewardsLoading,
  toggleFavourite,
  updateReward,
} from "@/store/slices/rewards.slice";
import type { RootState } from "@/store/store";
import type { Reward } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getRewards: jest.fn(),
  createReward: jest.fn(),
  updateReward: jest.fn(),
  deleteReward: jest.fn(),
  toggleRewardFavourite: jest.fn(),
}));

import {
  createReward as apiCreateReward,
  deleteReward as apiDeleteReward,
  updateReward as apiUpdateReward,
  getRewards,
  toggleRewardFavourite,
} from "@/lib/api-client";

const mockedGetRewards = getRewards as jest.MockedFunction<typeof getRewards>;
const mockedCreateReward = apiCreateReward as jest.MockedFunction<
  typeof apiCreateReward
>;
const mockedUpdateReward = apiUpdateReward as jest.MockedFunction<
  typeof apiUpdateReward
>;
const mockedDeleteReward = apiDeleteReward as jest.MockedFunction<
  typeof apiDeleteReward
>;
const mockedToggleFavourite = toggleRewardFavourite as jest.MockedFunction<
  typeof toggleRewardFavourite
>;

interface TestRootState {
  rewards: ReturnType<typeof rewardsReducer>;
}

describe("rewards.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const familyId = "family-123";
  const userId = "user-123";

  const mockReward: Reward = {
    _id: "reward-1",
    familyId,
    name: "Extra Screen Time",
    karmaCost: 50,
    description: "30 minutes of extra screen time",
    imageUrl: "https://example.com/image.jpg",
    createdBy: "parent-123",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    claimCount: 5,
    isFavourite: false,
  };

  const mockReward2: Reward = {
    _id: "reward-2",
    familyId,
    name: "Ice Cream",
    karmaCost: 30,
    createdBy: "parent-123",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    claimCount: 2,
    isFavourite: true,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        rewards: rewardsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().rewards;
      expect(state.rewards).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeNull();
    });
  });

  describe("fetchRewards async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchRewards(familyId));
      const state = store.getState().rewards;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set rewards when fulfilled", async () => {
      const mockRewards = [mockReward, mockReward2];
      mockedGetRewards.mockResolvedValueOnce(mockRewards);

      await store.dispatch(fetchRewards(familyId));
      const state = store.getState().rewards;

      expect(state.isLoading).toBe(false);
      expect(state.rewards).toEqual(mockRewards);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeTruthy();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch rewards";
      mockedGetRewards.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchRewards(familyId));
      const state = store.getState().rewards;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetRewards.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchRewards(familyId));
      const state = store.getState().rewards;

      expect(state.error).toBe("Failed to fetch rewards");
    });
  });

  describe("createReward async thunk", () => {
    const newRewardData = {
      name: "New Reward",
      karmaCost: 100,
      description: "A new reward",
    };

    it("should add reward optimistically", () => {
      mockedCreateReward.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      store.dispatch(createReward({ familyId, data: newRewardData }));
      const state = store.getState().rewards;

      // Should have optimistic reward
      expect(state.rewards).toHaveLength(1);
      expect(state.rewards[0].name).toBe(newRewardData.name);
      expect(state.rewards[0]._id).toContain("temp-");
    });

    it("should replace optimistic reward with API response", async () => {
      const createdReward: Reward = {
        ...mockReward,
        name: newRewardData.name,
        karmaCost: newRewardData.karmaCost,
        description: newRewardData.description,
      };
      mockedCreateReward.mockResolvedValueOnce(createdReward);

      await store.dispatch(createReward({ familyId, data: newRewardData }));
      const state = store.getState().rewards;

      expect(state.rewards).toHaveLength(1);
      expect(state.rewards[0]._id).toBe(createdReward._id);
      expect(state.rewards[0].name).toBe(newRewardData.name);
    });

    it("should remove optimistic reward on error", async () => {
      mockedCreateReward.mockRejectedValueOnce(new Error("Failed to create"));

      await store.dispatch(createReward({ familyId, data: newRewardData }));
      const state = store.getState().rewards;

      expect(state.rewards).toHaveLength(0);
      expect(state.error).toBe("Failed to create");
    });
  });

  describe("updateReward async thunk", () => {
    const updateData = {
      name: "Updated Name",
      karmaCost: 75,
    };

    beforeEach(async () => {
      mockedGetRewards.mockResolvedValueOnce([mockReward]);
      await store.dispatch(fetchRewards(familyId));
    });

    it("should update reward when fulfilled", async () => {
      const updatedReward: Reward = {
        ...mockReward,
        ...updateData,
        updatedAt: "2024-01-03T00:00:00Z",
      };
      mockedUpdateReward.mockResolvedValueOnce(updatedReward);

      await store.dispatch(
        updateReward({ familyId, rewardId: mockReward._id, data: updateData }),
      );
      const state = store.getState().rewards;

      expect(state.rewards[0].name).toBe(updateData.name);
      expect(state.rewards[0].karmaCost).toBe(updateData.karmaCost);
    });

    it("should set error when rejected", async () => {
      mockedUpdateReward.mockRejectedValueOnce(new Error("Failed to update"));

      await store.dispatch(
        updateReward({ familyId, rewardId: mockReward._id, data: updateData }),
      );
      const state = store.getState().rewards;

      expect(state.error).toBe("Failed to update");
    });
  });

  describe("deleteReward async thunk", () => {
    beforeEach(async () => {
      mockedGetRewards.mockResolvedValueOnce([mockReward, mockReward2]);
      await store.dispatch(fetchRewards(familyId));
    });

    it("should remove reward optimistically", () => {
      mockedDeleteReward.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      store.dispatch(deleteReward({ familyId, rewardId: mockReward._id }));
      const state = store.getState().rewards;

      expect(state.rewards).toHaveLength(1);
      expect(state.rewards[0]._id).toBe(mockReward2._id);
    });

    it("should keep reward removed when fulfilled", async () => {
      mockedDeleteReward.mockResolvedValueOnce();

      await store.dispatch(
        deleteReward({ familyId, rewardId: mockReward._id }),
      );
      const state = store.getState().rewards;

      expect(state.rewards).toHaveLength(1);
      expect(state.rewards[0]._id).toBe(mockReward2._id);
    });

    it("should restore reward on error", async () => {
      mockedDeleteReward.mockRejectedValueOnce(new Error("Failed to delete"));

      await store.dispatch(
        deleteReward({ familyId, rewardId: mockReward._id }),
      );
      const state = store.getState().rewards;

      expect(state.rewards).toHaveLength(2);
      expect(state.error).toBe("Failed to delete");
    });
  });

  describe("toggleFavourite async thunk", () => {
    beforeEach(async () => {
      mockedGetRewards.mockResolvedValueOnce([mockReward]);
      await store.dispatch(fetchRewards(familyId));
    });

    it("should toggle favourite optimistically", () => {
      mockedToggleFavourite.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      store.dispatch(
        toggleFavourite({
          familyId,
          rewardId: mockReward._id,
          isFavourite: true,
        }),
      );
      const state = store.getState().rewards;

      expect(state.rewards[0].isFavourite).toBe(true);
    });

    it("should keep toggle when fulfilled", async () => {
      mockedToggleFavourite.mockResolvedValueOnce();

      await store.dispatch(
        toggleFavourite({
          familyId,
          rewardId: mockReward._id,
          isFavourite: true,
        }),
      );
      const state = store.getState().rewards;

      expect(state.rewards[0].isFavourite).toBe(true);
    });

    it("should revert toggle on error", async () => {
      mockedToggleFavourite.mockRejectedValueOnce(
        new Error("Failed to toggle"),
      );

      await store.dispatch(
        toggleFavourite({
          familyId,
          rewardId: mockReward._id,
          isFavourite: true,
        }),
      );
      const state = store.getState().rewards;

      expect(state.rewards[0].isFavourite).toBe(false);
      expect(state.error).toBe("Failed to toggle");
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      mockedGetRewards.mockResolvedValueOnce([mockReward, mockReward2]);
      await store.dispatch(fetchRewards(familyId));
    });

    describe("selectRewards", () => {
      it("should return all rewards", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectRewards(state)).toHaveLength(2);
      });
    });

    describe("selectRewardsLoading", () => {
      it("should return loading state", () => {
        store.dispatch(fetchRewards(familyId));
        const state = store.getState() as unknown as RootState;
        expect(selectRewardsLoading(state)).toBe(true);
      });
    });

    describe("selectRewardsError", () => {
      it("should return error message", async () => {
        mockedGetRewards.mockRejectedValueOnce(new Error("Test error"));
        await store.dispatch(fetchRewards(familyId));
        const state = store.getState() as unknown as RootState;
        expect(selectRewardsError(state)).toBe("Test error");
      });
    });

    describe("selectRewardById", () => {
      it("should return reward by id", () => {
        const state = store.getState() as unknown as RootState;
        const reward = selectRewardById(mockReward._id)(state);
        expect(reward).toEqual(mockReward);
      });

      it("should return undefined for non-existent id", () => {
        const state = store.getState() as unknown as RootState;
        const reward = selectRewardById("non-existent")(state);
        expect(reward).toBeUndefined();
      });
    });

    describe("selectFavouritedRewards", () => {
      it("should return only favourited rewards", () => {
        const state = store.getState() as unknown as RootState;
        const favourites = selectFavouritedRewards(state);
        expect(favourites).toHaveLength(1);
        expect(favourites[0]._id).toBe(mockReward2._id);
      });

      it("should return empty array when no favourites", async () => {
        // Clear and add non-favourited rewards
        mockedGetRewards.mockResolvedValueOnce([
          { ...mockReward, isFavourite: false },
        ]);
        await store.dispatch(fetchRewards(familyId));

        const state = store.getState() as unknown as RootState;
        const favourites = selectFavouritedRewards(state);
        expect(favourites).toHaveLength(0);
      });
    });
  });
});
