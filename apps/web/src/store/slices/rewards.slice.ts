import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import {
  createReward as apiCreateReward,
  deleteReward as apiDeleteReward,
  updateReward as apiUpdateReward,
  uploadRewardImage as apiUploadRewardImage,
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
  uploadError: string | null;
  lastFetch: number | null;
}

const initialState: RewardsState = {
  rewards: [],
  isLoading: false,
  error: null,
  uploadError: null,
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

export const uploadRewardImage = createAsyncThunk(
  "rewards/uploadRewardImage",
  async ({ familyId, file }: { familyId: string; file: File }) => {
    const response = await apiUploadRewardImage(familyId, file);
    return response.imageUrl;
  },
);

export const createReward = createAsyncThunk(
  "rewards/createReward",
  async (
    {
      familyId,
      data,
      imageFile,
    }: {
      familyId: string;
      data: CreateRewardRequest;
      imageFile?: File;
    },
    { dispatch },
  ) => {
    // If image file provided, upload it first
    let imageUrl = data.imageUrl;
    if (imageFile) {
      const uploadResponse = await apiUploadRewardImage(familyId, imageFile);
      imageUrl = uploadResponse.imageUrl;
    }

    // Create reward with uploaded image URL
    const reward = await apiCreateReward(familyId, { ...data, imageUrl });
    // Ensure store syncs with backend truth
    dispatch(fetchRewards(familyId));
    return reward;
  },
);

export const updateReward = createAsyncThunk(
  "rewards/updateReward",
  async (
    {
      familyId,
      rewardId,
      data,
      imageFile,
    }: {
      familyId: string;
      rewardId: string;
      data: UpdateRewardRequest;
      imageFile?: File;
    },
    { dispatch },
  ) => {
    // If image file provided, upload it first
    let imageUrl = data.imageUrl;
    if (imageFile) {
      const uploadResponse = await apiUploadRewardImage(familyId, imageFile);
      imageUrl = uploadResponse.imageUrl;
    }

    // Update reward with uploaded image URL
    const reward = await apiUpdateReward(familyId, rewardId, {
      ...data,
      imageUrl,
    });
    dispatch(fetchRewards(familyId));
    return reward;
  },
);

export const deleteReward = createAsyncThunk(
  "rewards/deleteReward",
  async (
    { familyId, rewardId }: { familyId: string; rewardId: string },
    { dispatch },
  ) => {
    await apiDeleteReward(familyId, rewardId);
    dispatch(fetchRewards(familyId));
    return rewardId;
  },
);

export const toggleFavourite = createAsyncThunk(
  "rewards/toggleFavourite",
  async (
    {
      familyId,
      rewardId,
      isFavourite,
    }: {
      familyId: string;
      rewardId: string;
      isFavourite: boolean;
    },
    { dispatch },
  ) => {
    await toggleRewardFavourite(familyId, rewardId, isFavourite);
    dispatch(fetchRewards(familyId));
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

      .addCase(createReward.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create reward";
      })

      // updateReward
      .addCase(updateReward.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update reward";
      })

      .addCase(deleteReward.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete reward";
      })

      .addCase(toggleFavourite.rejected, (state, action) => {
        state.error = action.error.message || "Failed to toggle favourite";
      })

      // uploadRewardImage
      .addCase(uploadRewardImage.pending, (state) => {
        state.uploadError = null;
      })
      .addCase(uploadRewardImage.fulfilled, (state) => {
        state.uploadError = null;
      })
      .addCase(uploadRewardImage.rejected, (state, action) => {
        state.uploadError = action.error.message || "Failed to upload image";
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
export const selectFavouritedRewards = createSelector(
  [(state: RootState) => state.rewards.rewards],
  (rewards) => rewards.filter((r) => r.isFavourite),
);
export const selectUploadError = (state: RootState) =>
  state.rewards.uploadError;
