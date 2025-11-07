import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  createReward as apiCreateReward,
  deleteReward as apiDeleteReward,
  updateReward as apiUpdateReward,
  getRewards,
  toggleRewardFavourite,
} from "@/lib/api-client";
import type {
  CreateRewardRequest,
  Reward,
  UpdateRewardRequest,
} from "@/types/api.types";
import type { RootState } from "../store";

interface RewardsState {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: RewardsState = {
  rewards: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchRewards = createAsyncThunk(
  "rewards/fetchRewards",
  async (familyId: string) => {
    const rewards = await getRewards(familyId);
    return rewards;
  },
);

export const createReward = createAsyncThunk(
  "rewards/createReward",
  async ({
    familyId,
    data,
  }: {
    familyId: string;
    data: CreateRewardRequest;
  }) => {
    const reward = await apiCreateReward(familyId, data);
    return reward;
  },
);

export const updateReward = createAsyncThunk(
  "rewards/updateReward",
  async ({
    familyId,
    rewardId,
    data,
  }: {
    familyId: string;
    rewardId: string;
    data: UpdateRewardRequest;
  }) => {
    const reward = await apiUpdateReward(familyId, rewardId, data);
    return reward;
  },
);

export const deleteReward = createAsyncThunk(
  "rewards/deleteReward",
  async ({ familyId, rewardId }: { familyId: string; rewardId: string }) => {
    await apiDeleteReward(familyId, rewardId);
    return rewardId;
  },
);

export const toggleFavourite = createAsyncThunk(
  "rewards/toggleFavourite",
  async ({
    familyId,
    rewardId,
    isFavourite,
  }: {
    familyId: string;
    rewardId: string;
    isFavourite: boolean;
  }) => {
    await toggleRewardFavourite(familyId, rewardId, isFavourite);
    return { rewardId, isFavourite };
  },
);

const rewardsSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchRewards
      .addCase(fetchRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rewards = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch rewards";
      })

      // createReward - optimistic update
      .addCase(createReward.pending, (state, action) => {
        // Add optimistic reward
        const optimisticReward: Reward = {
          _id: `temp-${Date.now()}`,
          familyId: action.meta.arg.familyId,
          name: action.meta.arg.data.name,
          karmaCost: action.meta.arg.data.karmaCost,
          description: action.meta.arg.data.description,
          imageUrl: action.meta.arg.data.imageUrl,
          createdBy: "", // Will be filled by API
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.rewards.push(optimisticReward);
      })
      .addCase(createReward.fulfilled, (state, action) => {
        // Replace optimistic reward with real one
        const tempIndex = state.rewards.findIndex((r) =>
          r._id.startsWith("temp-"),
        );
        if (tempIndex !== -1) {
          state.rewards[tempIndex] = action.payload;
        }
      })
      .addCase(createReward.rejected, (state, action) => {
        // Remove optimistic reward
        state.rewards = state.rewards.filter((r) => !r._id.startsWith("temp-"));
        state.error = action.error.message || "Failed to create reward";
      })

      // updateReward
      .addCase(updateReward.fulfilled, (state, action) => {
        const index = state.rewards.findIndex(
          (r) => r._id === action.payload._id,
        );
        if (index !== -1) {
          state.rewards[index] = action.payload;
        }
      })
      .addCase(updateReward.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update reward";
      })

      // deleteReward - optimistic update
      .addCase(deleteReward.pending, (state, action) => {
        // Store the reward being deleted for potential rollback
        const rewardToDelete = state.rewards.find(
          (r) => r._id === action.meta.arg.rewardId,
        );
        if (rewardToDelete) {
          (state as any)._deletedReward = rewardToDelete;
        }
        // Optimistically remove
        state.rewards = state.rewards.filter(
          (r) => r._id !== action.meta.arg.rewardId,
        );
      })
      .addCase(deleteReward.fulfilled, (state) => {
        // Keep it deleted, clean up temp storage
        delete (state as any)._deletedReward;
      })
      .addCase(deleteReward.rejected, (state, action) => {
        // Restore the deleted reward
        const deletedReward = (state as any)._deletedReward;
        if (deletedReward) {
          state.rewards.push(deletedReward);
          delete (state as any)._deletedReward;
        }
        state.error = action.error.message || "Failed to delete reward";
      })

      // toggleFavourite - optimistic update
      .addCase(toggleFavourite.pending, (state, action) => {
        const reward = state.rewards.find(
          (r) => r._id === action.meta.arg.rewardId,
        );
        if (reward) {
          // Store original value for rollback
          (state as any)._originalFavourite = reward.isFavourite;
          reward.isFavourite = action.meta.arg.isFavourite;
        }
      })
      .addCase(toggleFavourite.fulfilled, (state) => {
        // Keep the toggle, clean up temp storage
        delete (state as any)._originalFavourite;
      })
      .addCase(toggleFavourite.rejected, (state, action) => {
        // Revert the toggle
        const reward = state.rewards.find(
          (r) => r._id === action.meta.arg.rewardId,
        );
        if (reward && (state as any)._originalFavourite !== undefined) {
          reward.isFavourite = (state as any)._originalFavourite;
          delete (state as any)._originalFavourite;
        }
        state.error = action.error.message || "Failed to toggle favourite";
      });
  },
});

export default rewardsSlice.reducer;

// Selectors
export const selectRewards = (state: RootState) => state.rewards.rewards;
export const selectRewardsLoading = (state: RootState) =>
  state.rewards.isLoading;
export const selectRewardsError = (state: RootState) => state.rewards.error;
export const selectRewardById = (rewardId: string) => (state: RootState) =>
  state.rewards.rewards.find((r) => r._id === rewardId);
export const selectFavouritedRewards = (state: RootState) =>
  state.rewards.rewards.filter((r) => r.isFavourite);
