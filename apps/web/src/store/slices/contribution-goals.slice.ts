import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  addDeduction as addDeductionApi,
  createContributionGoal as createContributionGoalApi,
  deleteContributionGoal as deleteContributionGoalApi,
  getContributionGoal as getContributionGoalApi,
  updateContributionGoal as updateContributionGoalApi,
} from "@/lib/api-client";
import type {
  AddDeductionRequest,
  ContributionGoal,
  CreateContributionGoalRequest,
  UpdateContributionGoalRequest,
} from "@/types/api.types";
import type { RootState } from "../store";

interface ContributionGoalsState {
  goalsByMemberId: Record<string, ContributionGoal>;
  isLoading: boolean;
  error: string | null;
  operations: {
    create: { isLoading: boolean; error: string | null };
    update: { isLoading: boolean; error: string | null };
    delete: { isLoading: boolean; error: string | null };
    addDeduction: { isLoading: boolean; error: string | null };
  };
}

const initialState: ContributionGoalsState = {
  goalsByMemberId: {},
  isLoading: false,
  error: null,
  operations: {
    create: { isLoading: false, error: null },
    update: { isLoading: false, error: null },
    delete: { isLoading: false, error: null },
    addDeduction: { isLoading: false, error: null },
  },
};

// Async thunks
export const fetchContributionGoal = createAsyncThunk(
  "contributionGoals/fetchGoal",
  async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
    const goal = await getContributionGoalApi(familyId, memberId);
    return { memberId, goal };
  },
);

export const createContributionGoal = createAsyncThunk(
  "contributionGoals/create",
  async ({
    familyId,
    data,
  }: {
    familyId: string;
    data: CreateContributionGoalRequest;
  }) => {
    const goal = await createContributionGoalApi(familyId, data);
    return goal;
  },
);

export const updateContributionGoal = createAsyncThunk(
  "contributionGoals/update",
  async ({
    familyId,
    memberId,
    data,
  }: {
    familyId: string;
    memberId: string;
    data: UpdateContributionGoalRequest;
  }) => {
    const goal = await updateContributionGoalApi(familyId, memberId, data);
    return goal;
  },
);

export const deleteContributionGoal = createAsyncThunk(
  "contributionGoals/delete",
  async ({ familyId, memberId }: { familyId: string; memberId: string }) => {
    await deleteContributionGoalApi(familyId, memberId);
    return { memberId };
  },
);

export const addDeduction = createAsyncThunk(
  "contributionGoals/addDeduction",
  async ({
    familyId,
    memberId,
    data,
  }: {
    familyId: string;
    memberId: string;
    data: AddDeductionRequest;
  }) => {
    const goal = await addDeductionApi(familyId, memberId, data);
    return goal;
  },
);

const contributionGoalsSlice = createSlice({
  name: "contributionGoals",
  initialState,
  reducers: {
    clearGoal: (state, action: PayloadAction<string>) => {
      delete state.goalsByMemberId[action.payload];
    },
    clearError: (state) => {
      state.error = null;
    },
    clearOperationError: (
      state,
      action: PayloadAction<keyof ContributionGoalsState["operations"]>,
    ) => {
      state.operations[action.payload].error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch contribution goal
    builder
      .addCase(fetchContributionGoal.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContributionGoal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.goalsByMemberId[action.payload.memberId] = action.payload.goal;
      })
      .addCase(fetchContributionGoal.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.error.message || "Failed to fetch contribution goal";
      });

    // Create contribution goal
    builder
      .addCase(createContributionGoal.pending, (state) => {
        state.operations.create.isLoading = true;
        state.operations.create.error = null;
      })
      .addCase(createContributionGoal.fulfilled, (state, action) => {
        state.operations.create.isLoading = false;
        state.goalsByMemberId[action.payload.memberId] = action.payload;
      })
      .addCase(createContributionGoal.rejected, (state, action) => {
        state.operations.create.isLoading = false;
        state.operations.create.error =
          action.error.message || "Failed to create contribution goal";
      });

    // Update contribution goal
    builder
      .addCase(updateContributionGoal.pending, (state) => {
        state.operations.update.isLoading = true;
        state.operations.update.error = null;
      })
      .addCase(updateContributionGoal.fulfilled, (state, action) => {
        state.operations.update.isLoading = false;
        state.goalsByMemberId[action.payload.memberId] = action.payload;
      })
      .addCase(updateContributionGoal.rejected, (state, action) => {
        state.operations.update.isLoading = false;
        state.operations.update.error =
          action.error.message || "Failed to update contribution goal";
      });

    // Delete contribution goal
    builder
      .addCase(deleteContributionGoal.pending, (state) => {
        state.operations.delete.isLoading = true;
        state.operations.delete.error = null;
      })
      .addCase(deleteContributionGoal.fulfilled, (state, action) => {
        state.operations.delete.isLoading = false;
        delete state.goalsByMemberId[action.payload.memberId];
      })
      .addCase(deleteContributionGoal.rejected, (state, action) => {
        state.operations.delete.isLoading = false;
        state.operations.delete.error =
          action.error.message || "Failed to delete contribution goal";
      });

    // Add deduction
    builder
      .addCase(addDeduction.pending, (state) => {
        state.operations.addDeduction.isLoading = true;
        state.operations.addDeduction.error = null;
      })
      .addCase(addDeduction.fulfilled, (state, action) => {
        state.operations.addDeduction.isLoading = false;
        state.goalsByMemberId[action.payload.memberId] = action.payload;
      })
      .addCase(addDeduction.rejected, (state, action) => {
        state.operations.addDeduction.isLoading = false;
        state.operations.addDeduction.error =
          action.error.message || "Failed to add deduction";
      });
  },
});

export const { clearGoal, clearError, clearOperationError } =
  contributionGoalsSlice.actions;

// Selectors
export const selectContributionGoalByMemberId = (
  state: RootState,
  memberId: string,
) => state.contributionGoals.goalsByMemberId[memberId];

export const selectCurrentUserContributionGoal = (state: RootState) => {
  const userId = state.user.profile?.id;
  if (!userId) return null;
  return state.contributionGoals.goalsByMemberId[userId];
};

export const selectOperationLoading = (
  state: RootState,
  operation: keyof ContributionGoalsState["operations"],
) => state.contributionGoals.operations[operation].isLoading;

export const selectOperationError = (
  state: RootState,
  operation: keyof ContributionGoalsState["operations"],
) => state.contributionGoals.operations[operation].error;

export const selectIsLoading = (state: RootState) =>
  state.contributionGoals.isLoading;

export const selectError = (state: RootState) => state.contributionGoals.error;

export default contributionGoalsSlice.reducer;
