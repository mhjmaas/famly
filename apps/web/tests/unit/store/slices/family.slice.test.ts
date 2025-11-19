import { configureStore } from "@reduxjs/toolkit";
import type { FamilyMember, FamilyWithMembers } from "@/lib/api-client";
import familyReducer, {
  addFamilyMember,
  clearFamily,
  clearOperationError,
  fetchFamilies,
  grantMemberKarma,
  removeFamilyMember,
  selectCurrentFamily,
  selectFamilies,
  selectFamilyError,
  selectFamilyLoading,
  selectFamilyMemberById,
  selectFamilyMembers,
  selectOperationError,
  selectOperationLoading,
  setOperationError,
  updateMemberRole,
} from "@/store/slices/family.slice";
import karmaReducer from "@/store/slices/karma.slice";
import type { RootState } from "@/store/store";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getFamilies: jest.fn(),
  getKarmaBalance: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  grantKarma: jest.fn(),
  addFamilyMember: jest.fn(),
}));

import {
  addFamilyMember as addFamilyMemberApi,
  getFamilies,
  getKarmaBalance,
  grantKarma as grantKarmaApi,
  removeMember as removeMemberApi,
  updateMemberRole as updateMemberRoleApi,
} from "@/lib/api-client";

const mockedGetFamilies = getFamilies as jest.MockedFunction<
  typeof getFamilies
>;
const mockedGetKarmaBalance = getKarmaBalance as jest.MockedFunction<
  typeof getKarmaBalance
>;
const mockedUpdateMemberRole = updateMemberRoleApi as jest.MockedFunction<
  typeof updateMemberRoleApi
>;
const mockedRemoveMember = removeMemberApi as jest.MockedFunction<
  typeof removeMemberApi
>;
const mockedGrantKarma = grantKarmaApi as jest.MockedFunction<
  typeof grantKarmaApi
>;
const mockedAddFamilyMember = addFamilyMemberApi as jest.MockedFunction<
  typeof addFamilyMemberApi
>;

interface TestRootState {
  family: ReturnType<typeof familyReducer>;
  karma: ReturnType<typeof karmaReducer>;
}

describe("family.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const mockMember1: FamilyMember = {
    memberId: "member-1",
    name: "John Doe",
    birthdate: "1985-03-15",
    role: "Parent",
    linkedAt: "2024-01-01T00:00:00Z",
  };

  const mockMember2: FamilyMember = {
    memberId: "member-2",
    name: "Jane Doe",
    birthdate: "2010-05-20",
    role: "Child",
    linkedAt: "2024-01-01T00:00:00Z",
  };

  const mockFamily: FamilyWithMembers = {
    familyId: "family-123",
    name: "Test Family",
    role: "Parent",
    linkedAt: "2024-01-01T00:00:00Z",
    members: [mockMember1, mockMember2],
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        family: familyReducer,
        karma: karmaReducer,
      },
    });
    jest.clearAllMocks();

    // Mock karma balance calls with default values
    mockedGetKarmaBalance.mockResolvedValue({
      userId: "member-1",
      familyId: "family-123",
      totalKarma: 100,
      lastUpdated: "2024-01-01T00:00:00Z",
    });
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().family;
      expect(state.families).toBeNull();
      expect(state.currentFamily).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.operations.updateRole).toEqual({
        isLoading: false,
        error: null,
      });
      expect(state.operations.removeMember).toEqual({
        isLoading: false,
        error: null,
      });
      expect(state.operations.grantKarma).toEqual({
        isLoading: false,
        error: null,
      });
      expect(state.operations.addMember).toEqual({
        isLoading: false,
        error: null,
      });
    });
  });

  describe("clearFamily action", () => {
    it("should clear families and errors", () => {
      // First set some state
      mockedGetFamilies.mockResolvedValueOnce([mockFamily]);
      store.dispatch(fetchFamilies());

      // Then clear
      store.dispatch(clearFamily());
      const state = store.getState().family;

      expect(state.families).toBeNull();
      expect(state.currentFamily).toBeNull();
      expect(state.error).toBeNull();
    });
  });

  describe("setOperationError action", () => {
    it("should set error for specific operation", () => {
      store.dispatch(
        setOperationError({ operation: "updateRole", error: "Test error" }),
      );
      const state = store.getState().family;

      expect(state.operations.updateRole.error).toBe("Test error");
    });
  });

  describe("clearOperationError action", () => {
    it("should clear error for specific operation", () => {
      // First set an error
      store.dispatch(
        setOperationError({ operation: "updateRole", error: "Test error" }),
      );
      expect(store.getState().family.operations.updateRole.error).toBe(
        "Test error",
      );

      // Then clear it
      store.dispatch(clearOperationError("updateRole"));
      expect(store.getState().family.operations.updateRole.error).toBeNull();
    });
  });

  describe("fetchFamilies async thunk", () => {
    it("should set loading state when pending", () => {
      mockedGetFamilies.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );
      store.dispatch(fetchFamilies());
      const state = store.getState().family;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set families when fulfilled", async () => {
      mockedGetFamilies.mockResolvedValueOnce([mockFamily]);

      await store.dispatch(fetchFamilies());
      const state = store.getState().family;

      expect(state.isLoading).toBe(false);
      expect(state.families).toEqual([mockFamily]);
      expect(state.currentFamily).toEqual(mockFamily);
      expect(state.error).toBeNull();
    });

    it("should set currentFamily to first family", async () => {
      const family2: FamilyWithMembers = {
        ...mockFamily,
        familyId: "family-456",
        name: "Second Family",
      };
      mockedGetFamilies.mockResolvedValueOnce([mockFamily, family2]);

      await store.dispatch(fetchFamilies());
      const state = store.getState().family;

      expect(state.currentFamily).toEqual(mockFamily);
    });

    it("should handle empty families array", async () => {
      mockedGetFamilies.mockResolvedValueOnce([]);

      await store.dispatch(fetchFamilies());
      const state = store.getState().family;

      expect(state.families).toEqual([]);
      expect(state.currentFamily).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch families";
      mockedGetFamilies.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchFamilies());
      const state = store.getState().family;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe("updateMemberRole async thunk", () => {
    beforeEach(async () => {
      mockedGetFamilies.mockResolvedValue([mockFamily]);
      await store.dispatch(fetchFamilies());
    });

    it("should set operation loading state when pending", () => {
      mockedUpdateMemberRole.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );
      store.dispatch(
        updateMemberRole({
          familyId: "family-123",
          memberId: "member-1",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.updateRole.isLoading).toBe(true);
      expect(state.operations.updateRole.error).toBeNull();
    });

    it("should refetch families after successful update", async () => {
      mockedUpdateMemberRole.mockResolvedValueOnce({
        memberId: "member-1",
        familyId: "family-123",
        role: "Child",
        updatedAt: "2024-01-02T00:00:00Z",
      });

      const updatedFamily = {
        ...mockFamily,
        members: [{ ...mockMember1, role: "Child" as const }, mockMember2],
      };
      mockedGetFamilies.mockResolvedValueOnce([updatedFamily]);

      await store.dispatch(
        updateMemberRole({
          familyId: "family-123",
          memberId: "member-1",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.updateRole.isLoading).toBe(false);
      expect(mockedGetFamilies).toHaveBeenCalledTimes(2); // Initial + refetch
    });

    it("should set operation error when rejected", async () => {
      const errorMessage = "Failed to update role";
      mockedUpdateMemberRole.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        updateMemberRole({
          familyId: "family-123",
          memberId: "member-1",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.updateRole.isLoading).toBe(false);
      expect(state.operations.updateRole.error).toBe(errorMessage);
    });
  });

  describe("removeFamilyMember async thunk", () => {
    beforeEach(async () => {
      mockedGetFamilies.mockResolvedValue([mockFamily]);
      await store.dispatch(fetchFamilies());
    });

    it("should set operation loading state when pending", () => {
      mockedRemoveMember.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );
      store.dispatch(
        removeFamilyMember({
          familyId: "family-123",
          memberId: "member-2",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.removeMember.isLoading).toBe(true);
      expect(state.operations.removeMember.error).toBeNull();
    });

    it("should refetch families after successful removal", async () => {
      mockedRemoveMember.mockResolvedValueOnce();

      const updatedFamily = {
        ...mockFamily,
        members: [mockMember1],
      };
      mockedGetFamilies.mockResolvedValueOnce([updatedFamily]);

      await store.dispatch(
        removeFamilyMember({
          familyId: "family-123",
          memberId: "member-2",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.removeMember.isLoading).toBe(false);
      expect(mockedGetFamilies).toHaveBeenCalledTimes(2);
    });

    it("should set operation error when rejected", async () => {
      const errorMessage = "Failed to remove member";
      mockedRemoveMember.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        removeFamilyMember({
          familyId: "family-123",
          memberId: "member-2",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.removeMember.isLoading).toBe(false);
      expect(state.operations.removeMember.error).toBe(errorMessage);
    });
  });

  describe("grantMemberKarma async thunk", () => {
    beforeEach(async () => {
      mockedGetFamilies.mockResolvedValue([mockFamily]);
      await store.dispatch(fetchFamilies());
    });

    it("should set operation loading state when pending", () => {
      mockedGrantKarma.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );
      store.dispatch(
        grantMemberKarma({
          familyId: "family-123",
          userId: "member-2",
          amount: 10,
          description: "Good job!",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.grantKarma.isLoading).toBe(true);
      expect(state.operations.grantKarma.error).toBeNull();
    });

    it("should update karma slice after successful karma grant", async () => {
      mockedGrantKarma.mockResolvedValueOnce({
        eventId: "event-123",
        familyId: "family-123",
        userId: "member-2",
        amount: 10,
        totalKarma: 60,
        description: "Good job!",
        grantedBy: "member-1",
        createdAt: "2024-01-02T00:00:00Z",
      });

      await store.dispatch(
        grantMemberKarma({
          familyId: "family-123",
          userId: "member-2",
          amount: 10,
          description: "Good job!",
        }),
      );
      const state = store.getState();

      expect(state.family.operations.grantKarma.isLoading).toBe(false);
      // Verify karma was updated in karma slice (single source of truth)
      expect(state.karma.balances["member-2"]).toBe(60);
    });

    it("should handle negative karma amounts", async () => {
      mockedGrantKarma.mockResolvedValueOnce({
        eventId: "event-124",
        familyId: "family-123",
        userId: "member-2",
        amount: -5,
        totalKarma: 45,
        description: "Forgot chores",
        grantedBy: "member-1",
        createdAt: "2024-01-02T00:00:00Z",
      });

      await store.dispatch(
        grantMemberKarma({
          familyId: "family-123",
          userId: "member-2",
          amount: -5,
          description: "Forgot chores",
        }),
      );

      expect(mockedGrantKarma).toHaveBeenCalledWith("family-123", {
        userId: "member-2",
        amount: -5,
        description: "Forgot chores",
      });

      // Verify karma was updated in karma slice
      const state = store.getState();
      expect(state.karma.balances["member-2"]).toBe(45);
    });

    it("should set operation error when rejected", async () => {
      const errorMessage = "Failed to grant karma";
      mockedGrantKarma.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        grantMemberKarma({
          familyId: "family-123",
          userId: "member-2",
          amount: 10,
          description: "Good job!",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.grantKarma.isLoading).toBe(false);
      expect(state.operations.grantKarma.error).toBe(errorMessage);
    });
  });

  describe("addFamilyMember async thunk", () => {
    beforeEach(async () => {
      mockedGetFamilies.mockResolvedValue([mockFamily]);
      await store.dispatch(fetchFamilies());
    });

    it("should set operation loading state when pending", () => {
      mockedAddFamilyMember.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );
      store.dispatch(
        addFamilyMember({
          familyId: "family-123",
          email: "new@example.com",
          password: "password123",
          name: "New Member",
          birthdate: "2015-01-01",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.addMember.isLoading).toBe(true);
      expect(state.operations.addMember.error).toBeNull();
    });

    it("should refetch families after successful member addition", async () => {
      mockedAddFamilyMember.mockResolvedValueOnce({
        memberId: "member-3",
        familyId: "family-123",
        role: "Child",
        linkedAt: "2024-01-02T00:00:00Z",
        addedBy: "member-1",
      });

      const newMember: FamilyMember = {
        memberId: "member-3",
        name: "New Member",
        birthdate: "2015-01-01",
        role: "Child",
        linkedAt: "2024-01-02T00:00:00Z",
      };

      const updatedFamily = {
        ...mockFamily,
        members: [...mockFamily.members, newMember],
      };
      mockedGetFamilies.mockResolvedValueOnce([updatedFamily]);

      await store.dispatch(
        addFamilyMember({
          familyId: "family-123",
          email: "new@example.com",
          password: "password123",
          name: "New Member",
          birthdate: "2015-01-01",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.addMember.isLoading).toBe(false);
      expect(mockedGetFamilies).toHaveBeenCalledTimes(2);
    });

    it("should set operation error when rejected", async () => {
      const errorMessage = "Failed to add member";
      mockedAddFamilyMember.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        addFamilyMember({
          familyId: "family-123",
          email: "new@example.com",
          password: "password123",
          name: "New Member",
          birthdate: "2015-01-01",
          role: "Child",
        }),
      );
      const state = store.getState().family;

      expect(state.operations.addMember.isLoading).toBe(false);
      expect(state.operations.addMember.error).toBe(errorMessage);
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      mockedGetFamilies.mockResolvedValueOnce([mockFamily]);
      await store.dispatch(fetchFamilies());
    });

    describe("selectFamilies", () => {
      it("should return families array", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectFamilies(state)).toEqual([mockFamily]);
      });

      it("should return null when no families", () => {
        store.dispatch(clearFamily());
        const state = store.getState() as unknown as RootState;
        expect(selectFamilies(state)).toBeNull();
      });
    });

    describe("selectCurrentFamily", () => {
      it("should return current family", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectCurrentFamily(state)).toEqual(mockFamily);
      });

      it("should return null when no families", () => {
        store.dispatch(clearFamily());
        const state = store.getState() as unknown as RootState;
        expect(selectCurrentFamily(state)).toBeNull();
      });
    });

    describe("selectFamilyMembers", () => {
      it("should return members array", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectFamilyMembers(state)).toEqual([mockMember1, mockMember2]);
      });

      it("should return empty array when no current family", () => {
        store.dispatch(clearFamily());
        const state = store.getState() as unknown as RootState;
        expect(selectFamilyMembers(state)).toEqual([]);
      });
    });

    describe("selectFamilyMemberById", () => {
      it("should return member when found", () => {
        const state = store.getState() as unknown as RootState;
        const member = selectFamilyMemberById("member-1")(state);
        expect(member).toEqual(mockMember1);
      });

      it("should return second member when requested", () => {
        const state = store.getState() as unknown as RootState;
        const member = selectFamilyMemberById("member-2")(state);
        expect(member).toEqual(mockMember2);
      });

      it("should return undefined when member not found", () => {
        const state = store.getState() as unknown as RootState;
        const member = selectFamilyMemberById("non-existent")(state);
        expect(member).toBeUndefined();
      });

      it("should return undefined when no current family", () => {
        store.dispatch(clearFamily());
        const state = store.getState() as unknown as RootState;
        const member = selectFamilyMemberById("member-1")(state);
        expect(member).toBeUndefined();
      });
    });

    describe("selectFamilyLoading", () => {
      it("should return loading state", () => {
        mockedGetFamilies.mockImplementation(
          () => new Promise(() => {}), // Never resolves
        );
        store.dispatch(fetchFamilies());
        const state = store.getState() as unknown as RootState;

        expect(selectFamilyLoading(state)).toBe(true);
      });
    });

    describe("selectFamilyError", () => {
      it("should return error message", async () => {
        const errorMessage = "Test error";
        mockedGetFamilies.mockRejectedValueOnce(new Error(errorMessage));

        await store.dispatch(fetchFamilies());
        const state = store.getState() as unknown as RootState;

        expect(selectFamilyError(state)).toBe(errorMessage);
      });
    });

    describe("selectOperationLoading", () => {
      it("should return loading state for specific operation", () => {
        mockedUpdateMemberRole.mockImplementation(
          () => new Promise(() => {}), // Never resolves
        );
        store.dispatch(
          updateMemberRole({
            familyId: "family-123",
            memberId: "member-1",
            role: "Child",
          }),
        );
        const state = store.getState() as unknown as RootState;

        expect(selectOperationLoading("updateRole")(state)).toBe(true);
        expect(selectOperationLoading("removeMember")(state)).toBe(false);
      });
    });

    describe("selectOperationError", () => {
      it("should return error for specific operation", async () => {
        const errorMessage = "Test error";
        mockedUpdateMemberRole.mockRejectedValueOnce(new Error(errorMessage));

        await store.dispatch(
          updateMemberRole({
            familyId: "family-123",
            memberId: "member-1",
            role: "Child",
          }),
        );
        const state = store.getState() as unknown as RootState;

        expect(selectOperationError("updateRole")(state)).toBe(errorMessage);
        expect(selectOperationError("removeMember")(state)).toBeNull();
      });
    });
  });
});
