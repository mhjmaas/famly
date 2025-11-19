import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type AddFamilyMemberRequest,
  addFamilyMember as addFamilyMemberApi,
  type FamilyWithMembers,
  type GrantKarmaRequest,
  getFamilies,
  getKarmaBalance,
  grantKarma as grantKarmaApi,
  removeMember as removeMemberApi,
  type UpdateMemberRoleRequest,
  updateMemberRole as updateMemberRoleApi,
} from "@/lib/api-client";
import type { RootState } from "../store";
import { setKarma } from "./karma.slice";

interface FamilyState {
  families: FamilyWithMembers[] | null;
  currentFamily: FamilyWithMembers | null;
  isLoading: boolean;
  error: string | null;
  operations: {
    updateRole: { isLoading: boolean; error: string | null };
    removeMember: { isLoading: boolean; error: string | null };
    grantKarma: { isLoading: boolean; error: string | null };
    addMember: { isLoading: boolean; error: string | null };
  };
}

const initialState: FamilyState = {
  families: null,
  currentFamily: null,
  isLoading: false,
  error: null,
  operations: {
    updateRole: { isLoading: false, error: null },
    removeMember: { isLoading: false, error: null },
    grantKarma: { isLoading: false, error: null },
    addMember: { isLoading: false, error: null },
  },
};

// Async thunks
export const fetchFamilies = createAsyncThunk(
  "family/fetchFamilies",
  async (_, { dispatch }) => {
    const families = await getFamilies();

    // Fetch karma for all members in all families and populate karma slice
    await Promise.all(
      families.flatMap((family) =>
        family.members.map(async (member) => {
          try {
            const karmaData = await getKarmaBalance(
              family.familyId,
              member.memberId,
            );
            // Dispatch to karma slice to store the balance
            dispatch(
              setKarma({
                userId: member.memberId,
                balance: karmaData.totalKarma,
              }),
            );
          } catch {
            // If karma fetch fails, set to 0
            dispatch(setKarma({ userId: member.memberId, balance: 0 }));
          }
        }),
      ),
    );

    return families;
  },
);

export const updateMemberRole = createAsyncThunk(
  "family/updateMemberRole",
  async (
    {
      familyId,
      memberId,
      role,
    }: { familyId: string; memberId: string; role: "Parent" | "Child" },
    { dispatch },
  ) => {
    const data: UpdateMemberRoleRequest = { role };
    await updateMemberRoleApi(familyId, memberId, data);
    // Refetch families to get updated data
    await dispatch(fetchFamilies());
  },
);

export const removeFamilyMember = createAsyncThunk(
  "family/removeFamilyMember",
  async (
    { familyId, memberId }: { familyId: string; memberId: string },
    { dispatch },
  ) => {
    await removeMemberApi(familyId, memberId);
    // Refetch families to get updated data
    await dispatch(fetchFamilies());
  },
);

export const grantMemberKarma = createAsyncThunk(
  "family/grantMemberKarma",
  async (
    {
      familyId,
      userId,
      amount,
      description,
    }: {
      familyId: string;
      userId: string;
      amount: number;
      description: string;
    },
    { dispatch },
  ) => {
    const data: GrantKarmaRequest = { userId, amount, description };
    const response = await grantKarmaApi(familyId, data);

    // Update karma slice with the new balance
    dispatch(
      setKarma({ userId: response.userId, balance: response.totalKarma }),
    );

    return response;
  },
);

export const addFamilyMember = createAsyncThunk(
  "family/addFamilyMember",
  async (
    {
      familyId,
      email,
      password,
      role,
      name,
      birthdate,
    }: {
      familyId: string;
      email: string;
      password: string;
      role: "Parent" | "Child";
      name: string;
      birthdate: string;
    },
    { dispatch },
  ) => {
    const data: AddFamilyMemberRequest = {
      email,
      password,
      role,
      name,
      birthdate,
    };
    await addFamilyMemberApi(familyId, data);
    // Refetch families to include new member
    await dispatch(fetchFamilies());
  },
);

const familySlice = createSlice({
  name: "family",
  initialState,
  reducers: {
    clearFamily: (state) => {
      state.families = null;
      state.currentFamily = null;
      state.error = null;
    },
    setOperationError: (
      state,
      action: PayloadAction<{ operation: string; error: string }>,
    ) => {
      const { operation, error } = action.payload;
      if (operation in state.operations) {
        (
          state.operations as Record<
            string,
            { isLoading: boolean; error: string | null }
          >
        )[operation].error = error;
      }
    },
    clearOperationError: (state, action: PayloadAction<string>) => {
      const operation = action.payload;
      if (operation in state.operations) {
        (
          state.operations as Record<
            string,
            { isLoading: boolean; error: string | null }
          >
        )[operation].error = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFamilies
      .addCase(fetchFamilies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFamilies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.families = action.payload;
        state.currentFamily = action.payload[0] || null;
      })
      .addCase(fetchFamilies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch families";
      })
      // updateMemberRole
      .addCase(updateMemberRole.pending, (state) => {
        state.operations.updateRole.isLoading = true;
        state.operations.updateRole.error = null;
      })
      .addCase(updateMemberRole.fulfilled, (state) => {
        state.operations.updateRole.isLoading = false;
      })
      .addCase(updateMemberRole.rejected, (state, action) => {
        state.operations.updateRole.isLoading = false;
        state.operations.updateRole.error =
          action.error.message || "Failed to update member role";
      })
      // removeFamilyMember
      .addCase(removeFamilyMember.pending, (state) => {
        state.operations.removeMember.isLoading = true;
        state.operations.removeMember.error = null;
      })
      .addCase(removeFamilyMember.fulfilled, (state) => {
        state.operations.removeMember.isLoading = false;
      })
      .addCase(removeFamilyMember.rejected, (state, action) => {
        state.operations.removeMember.isLoading = false;
        state.operations.removeMember.error =
          action.error.message || "Failed to remove member";
      })
      // grantMemberKarma
      .addCase(grantMemberKarma.pending, (state) => {
        state.operations.grantKarma.isLoading = true;
        state.operations.grantKarma.error = null;
      })
      .addCase(grantMemberKarma.fulfilled, (state) => {
        state.operations.grantKarma.isLoading = false;
        state.operations.grantKarma.error = null;
        // Karma is now managed entirely in the karma slice
      })
      .addCase(grantMemberKarma.rejected, (state, action) => {
        state.operations.grantKarma.isLoading = false;
        state.operations.grantKarma.error =
          action.error.message || "Failed to grant karma";
      })
      // addFamilyMember
      .addCase(addFamilyMember.pending, (state) => {
        state.operations.addMember.isLoading = true;
        state.operations.addMember.error = null;
      })
      .addCase(addFamilyMember.fulfilled, (state) => {
        state.operations.addMember.isLoading = false;
      })
      .addCase(addFamilyMember.rejected, (state, action) => {
        state.operations.addMember.isLoading = false;
        state.operations.addMember.error =
          action.error.message || "Failed to add member";
      });
  },
});

export const { clearFamily, setOperationError, clearOperationError } =
  familySlice.actions;
export default familySlice.reducer;

// Selectors
const EMPTY_ARRAY: readonly never[] = [];

export const selectFamilies = (state: RootState) => state.family.families;
export const selectCurrentFamily = (state: RootState) =>
  state.family.currentFamily;
export const selectFamilyMembers = (state: RootState) =>
  state.family.currentFamily?.members ?? EMPTY_ARRAY;
export const selectFamilyLoading = (state: RootState) => state.family.isLoading;
export const selectFamilyError = (state: RootState) => state.family.error;
export const selectOperationLoading =
  (operation: keyof FamilyState["operations"]) => (state: RootState) =>
    state.family.operations[operation].isLoading;
export const selectOperationError =
  (operation: keyof FamilyState["operations"]) => (state: RootState) =>
    state.family.operations[operation].error;
export const selectFamilyMemberById =
  (memberId: string) => (state: RootState) =>
    state.family.currentFamily?.members.find((m) => m.memberId === memberId);
