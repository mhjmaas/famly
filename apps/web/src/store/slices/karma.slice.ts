import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { getKarmaBalance } from "@/lib/api-client";
import type { RootState } from "../store";

interface KarmaState {
  // Map of userId → karma balance
  balances: Record<string, number>;
  isLoading: boolean;
  error: string | null;
}

const initialState: KarmaState = {
  balances: {},
  isLoading: false,
  error: null,
};

// Async thunk for fetching karma
export const fetchKarma = createAsyncThunk(
  "karma/fetchKarma",
  async ({ familyId, userId }: { familyId: string; userId: string }) => {
    const response = await getKarmaBalance(familyId, userId);
    return { userId, balance: response.balance };
  },
);

const karmaSlice = createSlice({
  name: "karma",
  initialState,
  reducers: {
    setKarma: (
      state,
      action: PayloadAction<{ userId: string; balance: number }>,
    ) => {
      state.balances[action.payload.userId] = action.payload.balance;
    },
    incrementKarma: (
      state,
      action: PayloadAction<{ userId: string; amount: number }>,
    ) => {
      const current = state.balances[action.payload.userId] || 0;
      state.balances[action.payload.userId] = current + action.payload.amount;
    },
    decrementKarma: (
      state,
      action: PayloadAction<{ userId: string; amount: number }>,
    ) => {
      const current = state.balances[action.payload.userId] || 0;
      state.balances[action.payload.userId] = Math.max(
        0,
        current - action.payload.amount,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKarma.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchKarma.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balances[action.payload.userId] = action.payload.balance;
      })
      .addCase(fetchKarma.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch karma";
      });
  },
});

export const { setKarma, incrementKarma, decrementKarma } = karmaSlice.actions;
export default karmaSlice.reducer;

// Selectors
export const selectKarmaBalance = (userId: string) => (state: RootState) =>
  state.karma.balances[userId] || 0;
export const selectKarmaLoading = (state: RootState) => state.karma.isLoading;
export const selectKarmaError = (state: RootState) => state.karma.error;
