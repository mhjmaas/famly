import { configureStore } from "@reduxjs/toolkit";
import contributionGoalsReducer, {
  addDeduction,
  clearError,
  clearGoal,
  clearOperationError,
  createContributionGoal,
  deleteContributionGoal,
  fetchContributionGoal,
  selectContributionGoalByMemberId,
  selectCurrentUserContributionGoal,
  selectError,
  selectIsLoading,
  selectOperationError,
  selectOperationLoading,
  updateContributionGoal,
} from "@/store/slices/contribution-goals.slice";
import type { RootState } from "@/store/store";
import type { ContributionGoal } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getContributionGoal: jest.fn(),
  createContributionGoal: jest.fn(),
  updateContributionGoal: jest.fn(),
  deleteContributionGoal: jest.fn(),
  addDeduction: jest.fn(),
}));

import {
  addDeduction as apiAddDeduction,
  createContributionGoal as apiCreateContributionGoal,
  deleteContributionGoal as apiDeleteContributionGoal,
  updateContributionGoal as apiUpdateContributionGoal,
  getContributionGoal,
} from "@/lib/api-client";

const mockedGetContributionGoal = getContributionGoal as jest.MockedFunction<
  typeof getContributionGoal
>;
const mockedCreateContributionGoal =
  apiCreateContributionGoal as jest.MockedFunction<
    typeof apiCreateContributionGoal
  >;
const mockedUpdateContributionGoal =
  apiUpdateContributionGoal as jest.MockedFunction<
    typeof apiUpdateContributionGoal
  >;
const mockedDeleteContributionGoal =
  apiDeleteContributionGoal as jest.MockedFunction<
    typeof apiDeleteContributionGoal
  >;
const mockedAddDeduction = apiAddDeduction as jest.MockedFunction<
  typeof apiAddDeduction
>;

interface UserState {
  profile: { id: string } | null;
  isLoading: boolean;
  error: string | null;
}

interface TestRootState {
  contributionGoals: ReturnType<typeof contributionGoalsReducer>;
  user: UserState;
}

const userReducer = (
  state: UserState = { profile: null, isLoading: false, error: null },
): UserState => state;

describe("contribution-goals.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const familyId = "family-123";
  const memberId = "member-456";

  const mockGoal: ContributionGoal = {
    _id: "goal-1",
    familyId,
    memberId,
    weekStartDate: "2024-01-07T18:00:00Z",
    title: "Complete 5 chores",
    description: "Help around the house this week",
    maxKarma: 100,
    recurring: false,
    currentKarma: 80,
    deductions: [
      {
        _id: "deduction-1",
        amount: 20,
        reason: "Forgot to do dishes",
        deductedBy: "parent-123",
        createdAt: "2024-01-08T10:00:00Z",
      },
    ],
    createdAt: "2024-01-07T18:00:00Z",
    updatedAt: "2024-01-08T10:00:00Z",
  };

  beforeEach(() => {
    store = configureStore<TestRootState>({
      reducer: {
        contributionGoals: contributionGoalsReducer,
        user: userReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().contributionGoals;
      expect(state.goalsByMemberId).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.operations.create.isLoading).toBe(false);
      expect(state.operations.create.error).toBe(null);
      expect(state.operations.update.isLoading).toBe(false);
      expect(state.operations.update.error).toBe(null);
      expect(state.operations.delete.isLoading).toBe(false);
      expect(state.operations.delete.error).toBe(null);
      expect(state.operations.addDeduction.isLoading).toBe(false);
      expect(state.operations.addDeduction.error).toBe(null);
    });
  });

  describe("fetchContributionGoal", () => {
    it("should handle pending state", () => {
      store.dispatch(fetchContributionGoal.pending("", { familyId, memberId }));
      const state = store.getState().contributionGoals;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });

    it("should handle fulfilled state", async () => {
      mockedGetContributionGoal.mockResolvedValue(mockGoal);

      await store.dispatch(fetchContributionGoal({ familyId, memberId }));

      const state = store.getState().contributionGoals;
      expect(state.isLoading).toBe(false);
      expect(state.goalsByMemberId[memberId]).toEqual(mockGoal);
      expect(mockedGetContributionGoal).toHaveBeenCalledWith(
        familyId,
        memberId,
      );
    });

    it("should handle rejected state", async () => {
      const errorMessage = "Failed to fetch goal";
      mockedGetContributionGoal.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(fetchContributionGoal({ familyId, memberId }));

      const state = store.getState().contributionGoals;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe("createContributionGoal", () => {
    const createData = {
      memberId,
      title: "New Goal",
      description: "Test description",
      maxKarma: 100,
    };

    it("should handle pending state", () => {
      store.dispatch(
        createContributionGoal.pending("", { familyId, data: createData }),
      );
      const state = store.getState().contributionGoals;
      expect(state.operations.create.isLoading).toBe(true);
      expect(state.operations.create.error).toBe(null);
    });

    it("should handle fulfilled state", async () => {
      mockedCreateContributionGoal.mockResolvedValue(mockGoal);

      await store.dispatch(
        createContributionGoal({ familyId, data: createData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.create.isLoading).toBe(false);
      expect(state.goalsByMemberId[memberId]).toEqual(mockGoal);
      expect(mockedCreateContributionGoal).toHaveBeenCalledWith(
        familyId,
        createData,
      );
    });

    it("should handle rejected state", async () => {
      const errorMessage = "Failed to create goal";
      mockedCreateContributionGoal.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(
        createContributionGoal({ familyId, data: createData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.create.isLoading).toBe(false);
      expect(state.operations.create.error).toBe(errorMessage);
    });
  });

  describe("updateContributionGoal", () => {
    const updateData = {
      title: "Updated Goal",
      maxKarma: 150,
    };

    beforeEach(() => {
      // Pre-populate state with a goal
      store.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );
    });

    it("should handle pending state", () => {
      store.dispatch(
        updateContributionGoal.pending("", {
          familyId,
          memberId,
          data: updateData,
        }),
      );
      const state = store.getState().contributionGoals;
      expect(state.operations.update.isLoading).toBe(true);
      expect(state.operations.update.error).toBe(null);
    });

    it("should handle fulfilled state", async () => {
      const updatedGoal = { ...mockGoal, ...updateData };
      mockedUpdateContributionGoal.mockResolvedValue(updatedGoal);

      await store.dispatch(
        updateContributionGoal({ familyId, memberId, data: updateData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.update.isLoading).toBe(false);
      expect(state.goalsByMemberId[memberId]).toEqual(updatedGoal);
      expect(mockedUpdateContributionGoal).toHaveBeenCalledWith(
        familyId,
        memberId,
        updateData,
      );
    });

    it("should handle rejected state", async () => {
      const errorMessage = "Failed to update goal";
      mockedUpdateContributionGoal.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(
        updateContributionGoal({ familyId, memberId, data: updateData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.update.isLoading).toBe(false);
      expect(state.operations.update.error).toBe(errorMessage);
    });
  });

  describe("deleteContributionGoal", () => {
    beforeEach(() => {
      // Pre-populate state with a goal
      store.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );
    });

    it("should handle pending state", () => {
      store.dispatch(
        deleteContributionGoal.pending("", { familyId, memberId }),
      );
      const state = store.getState().contributionGoals;
      expect(state.operations.delete.isLoading).toBe(true);
      expect(state.operations.delete.error).toBe(null);
    });

    it("should handle fulfilled state", async () => {
      mockedDeleteContributionGoal.mockResolvedValue();

      await store.dispatch(deleteContributionGoal({ familyId, memberId }));

      const state = store.getState().contributionGoals;
      expect(state.operations.delete.isLoading).toBe(false);
      expect(state.goalsByMemberId[memberId]).toBeUndefined();
      expect(mockedDeleteContributionGoal).toHaveBeenCalledWith(
        familyId,
        memberId,
      );
    });

    it("should handle rejected state", async () => {
      const errorMessage = "Failed to delete goal";
      mockedDeleteContributionGoal.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(deleteContributionGoal({ familyId, memberId }));

      const state = store.getState().contributionGoals;
      expect(state.operations.delete.isLoading).toBe(false);
      expect(state.operations.delete.error).toBe(errorMessage);
      // Goal should still exist after failed deletion
      expect(state.goalsByMemberId[memberId]).toEqual(mockGoal);
    });
  });

  describe("addDeduction", () => {
    const deductionData = {
      amount: 10,
      reason: "Left lights on",
    };

    beforeEach(() => {
      // Pre-populate state with a goal
      store.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );
    });

    it("should handle pending state", () => {
      store.dispatch(
        addDeduction.pending("", { familyId, memberId, data: deductionData }),
      );
      const state = store.getState().contributionGoals;
      expect(state.operations.addDeduction.isLoading).toBe(true);
      expect(state.operations.addDeduction.error).toBe(null);
    });

    it("should handle fulfilled state", async () => {
      const updatedGoal: ContributionGoal = {
        ...mockGoal,
        currentKarma: 70,
        deductions: [
          ...mockGoal.deductions,
          {
            _id: "deduction-2",
            amount: 10,
            reason: "Left lights on",
            deductedBy: "parent-123",
            createdAt: "2024-01-09T10:00:00Z",
          },
        ],
      };
      mockedAddDeduction.mockResolvedValue(updatedGoal);

      await store.dispatch(
        addDeduction({ familyId, memberId, data: deductionData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.addDeduction.isLoading).toBe(false);
      expect(state.goalsByMemberId[memberId]).toEqual(updatedGoal);
      expect(state.goalsByMemberId[memberId].deductions).toHaveLength(2);
      expect(mockedAddDeduction).toHaveBeenCalledWith(
        familyId,
        memberId,
        deductionData,
      );
    });

    it("should handle rejected state", async () => {
      const errorMessage = "Failed to add deduction";
      mockedAddDeduction.mockRejectedValue(new Error(errorMessage));

      await store.dispatch(
        addDeduction({ familyId, memberId, data: deductionData }),
      );

      const state = store.getState().contributionGoals;
      expect(state.operations.addDeduction.isLoading).toBe(false);
      expect(state.operations.addDeduction.error).toBe(errorMessage);
    });
  });

  describe("synchronous actions", () => {
    beforeEach(() => {
      // Pre-populate state with a goal and errors
      store.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );
      store.dispatch(
        fetchContributionGoal.rejected(new Error("Fetch error"), "", {
          familyId,
          memberId,
        }),
      );
      store.dispatch(
        createContributionGoal.rejected(new Error("Create error"), "", {
          familyId,
          data: { memberId, title: "", description: "", maxKarma: 0 },
        }),
      );
    });

    it("should clear goal by memberId", () => {
      store.dispatch(clearGoal(memberId));
      const state = store.getState().contributionGoals;
      expect(state.goalsByMemberId[memberId]).toBeUndefined();
    });

    it("should clear general error", () => {
      store.dispatch(clearError());
      const state = store.getState().contributionGoals;
      expect(state.error).toBe(null);
    });

    it("should clear operation error for create", () => {
      store.dispatch(clearOperationError("create"));
      const state = store.getState().contributionGoals;
      expect(state.operations.create.error).toBe(null);
    });

    it("should clear operation error for update", () => {
      store.dispatch(
        updateContributionGoal.rejected(new Error("Update error"), "", {
          familyId,
          memberId,
          data: {},
        }),
      );
      store.dispatch(clearOperationError("update"));
      const state = store.getState().contributionGoals;
      expect(state.operations.update.error).toBe(null);
    });

    it("should clear operation error for delete", () => {
      store.dispatch(
        deleteContributionGoal.rejected(new Error("Delete error"), "", {
          familyId,
          memberId,
        }),
      );
      store.dispatch(clearOperationError("delete"));
      const state = store.getState().contributionGoals;
      expect(state.operations.delete.error).toBe(null);
    });

    it("should clear operation error for addDeduction", () => {
      store.dispatch(
        addDeduction.rejected(new Error("Deduction error"), "", {
          familyId,
          memberId,
          data: { amount: 10, reason: "test" },
        }),
      );
      store.dispatch(clearOperationError("addDeduction"));
      const state = store.getState().contributionGoals;
      expect(state.operations.addDeduction.error).toBe(null);
    });
  });

  describe("selectors", () => {
    beforeEach(() => {
      // Pre-populate state
      store.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );
    });

    it("selectContributionGoalByMemberId should return goal", () => {
      const state = store.getState() as unknown as RootState;
      const goal = selectContributionGoalByMemberId(state, memberId);
      expect(goal).toEqual(mockGoal);
    });

    it("selectContributionGoalByMemberId should return undefined for non-existent member", () => {
      const state = store.getState() as unknown as RootState;
      const goal = selectContributionGoalByMemberId(state, "non-existent");
      expect(goal).toBeUndefined();
    });

    it("selectCurrentUserContributionGoal should return null when no user", () => {
      const state = store.getState() as unknown as RootState;
      const goal = selectCurrentUserContributionGoal(state);
      expect(goal).toBe(null);
    });

    it("selectCurrentUserContributionGoal should return goal for current user", () => {
      // Create a store with user profile
      const userReducerWithProfile = (
        state: UserState = {
          profile: { id: memberId },
          isLoading: false,
          error: null,
        },
      ): UserState => state;
      const storeWithUser = configureStore<TestRootState>({
        reducer: {
          contributionGoals: contributionGoalsReducer,
          user: userReducerWithProfile,
        },
      });
      storeWithUser.dispatch(
        createContributionGoal.fulfilled(mockGoal, "", {
          familyId,
          data: {
            memberId,
            title: mockGoal.title,
            description: mockGoal.description,
            maxKarma: mockGoal.maxKarma,
          },
        }),
      );

      const state = storeWithUser.getState() as unknown as RootState;
      const goal = selectCurrentUserContributionGoal(state);
      expect(goal).toEqual(mockGoal);
    });

    it("selectOperationLoading should return loading state", () => {
      store.dispatch(
        createContributionGoal.pending("", {
          familyId,
          data: { memberId, title: "", description: "", maxKarma: 0 },
        }),
      );
      const state = store.getState() as unknown as RootState;
      expect(selectOperationLoading(state, "create")).toBe(true);
      expect(selectOperationLoading(state, "update")).toBe(false);
    });

    it("selectOperationError should return error", () => {
      store.dispatch(
        createContributionGoal.rejected(new Error("Test error"), "", {
          familyId,
          data: { memberId, title: "", description: "", maxKarma: 0 },
        }),
      );
      const state = store.getState() as unknown as RootState;
      expect(selectOperationError(state, "create")).toBe("Test error");
      expect(selectOperationError(state, "update")).toBe(null);
    });

    it("selectIsLoading should return loading state", () => {
      store.dispatch(fetchContributionGoal.pending("", { familyId, memberId }));
      const state = store.getState() as unknown as RootState;
      expect(selectIsLoading(state)).toBe(true);
    });

    it("selectError should return error", () => {
      store.dispatch(
        fetchContributionGoal.rejected(new Error("Fetch error"), "", {
          familyId,
          memberId,
        }),
      );
      const state = store.getState() as unknown as RootState;
      expect(selectError(state)).toBe("Fetch error");
    });
  });
});
