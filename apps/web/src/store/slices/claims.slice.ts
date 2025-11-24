import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  cancelClaim as apiCancelClaim,
  claimReward as apiClaimReward,
  getClaims,
} from "@/lib/api-client";
import type { Claim } from "@/types/api.types";
import type { RootState } from "../store";
import { fetchRewards } from "./rewards.slice";

interface ClaimsState {
  claims: Claim[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: ClaimsState = {
  claims: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchClaims = createAsyncThunk(
  "claims/fetchClaims",
  async (familyId: string) => {
    const claims = await getClaims(familyId);
    return claims;
  },
);

export const claimReward = createAsyncThunk(
  "claims/claimReward",
  async (
    { familyId, rewardId }: { familyId: string; rewardId: string },
    { dispatch },
  ) => {
    const claim = await apiClaimReward(familyId, rewardId);
    // Refetch both claims and rewards (claim count changes)
    dispatch(fetchClaims(familyId));
    dispatch(fetchRewards(familyId));
    return claim;
  },
);

export const cancelClaim = createAsyncThunk(
  "claims/cancelClaim",
  async (
    { familyId, claimId }: { familyId: string; claimId: string },
    { dispatch },
  ) => {
    const claim = await apiCancelClaim(familyId, claimId);
    // Refetch both claims and rewards (claim count changes)
    dispatch(fetchClaims(familyId));
    dispatch(fetchRewards(familyId));
    return claim;
  },
);

const claimsSlice = createSlice({
  name: "claims",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchClaims
      .addCase(fetchClaims.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClaims.fulfilled, (state, action) => {
        state.isLoading = false;
        state.claims = action.payload;
        state.lastFetch = Date.now();
      })
      .addCase(fetchClaims.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch claims";
      })

      // claimReward
      .addCase(claimReward.rejected, (state, action) => {
        state.error = action.error.message || "Failed to claim reward";
      })

      // cancelClaim
      .addCase(cancelClaim.rejected, (state, action) => {
        state.error = action.error.message || "Failed to cancel claim";
      });
  },
});

export default claimsSlice.reducer;

// Selectors
export const selectClaims = (state: RootState) => state.claims.claims;
export const selectClaimsLoading = (state: RootState) => state.claims.isLoading;
export const selectClaimsError = (state: RootState) => state.claims.error;
export const selectPendingClaims = (state: RootState) =>
  state.claims.claims.filter((c: Claim) => c.status === "pending");
export const selectClaimByReward =
  (rewardId: string, userId: string) => (state: RootState) =>
    state.claims.claims.find(
      (c: Claim) => c.rewardId === rewardId && c.memberId === userId,
    );
export const selectUserPendingClaims = (userId: string) => (state: RootState) =>
  state.claims.claims.filter(
    (c: Claim) => c.memberId === userId && c.status === "pending",
  );
