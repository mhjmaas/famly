import { configureStore } from "@reduxjs/toolkit";
import claimsReducer, {
  cancelClaim,
  claimReward,
  fetchClaims,
  selectClaimByReward,
  selectClaims,
  selectClaimsError,
  selectClaimsLoading,
  selectPendingClaims,
  selectUserPendingClaims,
} from "@/store/slices/claims.slice";
import type { RootState } from "@/store/store";
import type { Claim } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getClaims: jest.fn(),
  claimReward: jest.fn(),
  cancelClaim: jest.fn(),
}));

import {
  cancelClaim as apiCancelClaim,
  claimReward as apiClaimReward,
  getClaims,
} from "@/lib/api-client";

const mockedGetClaims = getClaims as jest.MockedFunction<typeof getClaims>;
const mockedClaimReward = apiClaimReward as jest.MockedFunction<
  typeof apiClaimReward
>;
const mockedCancelClaim = apiCancelClaim as jest.MockedFunction<
  typeof apiCancelClaim
>;

interface TestRootState {
  claims: ReturnType<typeof claimsReducer>;
}

describe("claims.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const familyId = "family-123";
  const userId = "user-123";
  const rewardId = "reward-1";

  const mockClaim: Claim = {
    _id: "claim-1",
    familyId,
    rewardId,
    memberId: userId,
    status: "pending",
    karmaCost: 50,
    autoTaskId: "task-1",
    createdAt: "2024-01-01T00:00:00Z",
  };

  const mockCompletedClaim: Claim = {
    _id: "claim-2",
    familyId,
    rewardId: "reward-2",
    memberId: userId,
    status: "completed",
    karmaCost: 30,
    createdAt: "2024-01-02T00:00:00Z",
    completedAt: "2024-01-03T00:00:00Z",
    completedBy: "parent-123",
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        claims: claimsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().claims;
      expect(state.claims).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeNull();
    });
  });

  describe("fetchClaims async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchClaims(familyId));
      const state = store.getState().claims;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set claims when fulfilled", async () => {
      const mockClaims = [mockClaim, mockCompletedClaim];
      mockedGetClaims.mockResolvedValueOnce(mockClaims);

      await store.dispatch(fetchClaims(familyId));
      const state = store.getState().claims;

      expect(state.isLoading).toBe(false);
      expect(state.claims).toEqual(mockClaims);
      expect(state.error).toBeNull();
      expect(state.lastFetch).toBeTruthy();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch claims";
      mockedGetClaims.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchClaims(familyId));
      const state = store.getState().claims;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetClaims.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchClaims(familyId));
      const state = store.getState().claims;

      expect(state.error).toBe("Failed to fetch claims");
    });
  });

  describe("claimReward async thunk", () => {
    it("should add claim when fulfilled", async () => {
      const newClaim: Claim = {
        ...mockClaim,
        _id: "claim-new",
      };
      mockedClaimReward.mockResolvedValueOnce(newClaim);

      await store.dispatch(claimReward({ familyId, rewardId }));
      const state = store.getState().claims;

      expect(state.claims).toHaveLength(1);
      expect(state.claims[0]).toEqual(newClaim);
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Insufficient karma";
      mockedClaimReward.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(claimReward({ familyId, rewardId }));
      const state = store.getState().claims;

      expect(state.error).toBe(errorMessage);
    });
  });

  describe("cancelClaim async thunk", () => {
    beforeEach(async () => {
      mockedGetClaims.mockResolvedValueOnce([mockClaim]);
      await store.dispatch(fetchClaims(familyId));
    });

    it("should update claim status to cancelled when fulfilled", async () => {
      const cancelledClaim: Claim = {
        ...mockClaim,
        status: "cancelled",
        cancelledAt: "2024-01-04T00:00:00Z",
        cancelledBy: userId,
      };
      mockedCancelClaim.mockResolvedValueOnce(cancelledClaim);

      await store.dispatch(cancelClaim({ familyId, claimId: mockClaim._id }));
      const state = store.getState().claims;

      expect(state.claims[0].status).toBe("cancelled");
      expect(state.claims[0].cancelledAt).toBeTruthy();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Cannot cancel completed claim";
      mockedCancelClaim.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(cancelClaim({ familyId, claimId: mockClaim._id }));
      const state = store.getState().claims;

      expect(state.error).toBe(errorMessage);
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      mockedGetClaims.mockResolvedValueOnce([mockClaim, mockCompletedClaim]);
      await store.dispatch(fetchClaims(familyId));
    });

    describe("selectClaims", () => {
      it("should return all claims", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectClaims(state)).toHaveLength(2);
      });
    });

    describe("selectClaimsLoading", () => {
      it("should return loading state", () => {
        store.dispatch(fetchClaims(familyId));
        const state = store.getState() as unknown as RootState;
        expect(selectClaimsLoading(state)).toBe(true);
      });
    });

    describe("selectClaimsError", () => {
      it("should return error message", async () => {
        mockedGetClaims.mockRejectedValueOnce(new Error("Test error"));
        await store.dispatch(fetchClaims(familyId));
        const state = store.getState() as unknown as RootState;
        expect(selectClaimsError(state)).toBe("Test error");
      });
    });

    describe("selectPendingClaims", () => {
      it("should return only pending claims", () => {
        const state = store.getState() as unknown as RootState;
        const pending = selectPendingClaims(state);
        expect(pending).toHaveLength(1);
        expect(pending[0].status).toBe("pending");
      });
    });

    describe("selectClaimByReward", () => {
      it("should return claim for specific reward and user", () => {
        const state = store.getState() as unknown as RootState;
        const claim = selectClaimByReward(rewardId, userId)(state);
        expect(claim).toEqual(mockClaim);
      });

      it("should return undefined when no matching claim", () => {
        const state = store.getState() as unknown as RootState;
        const claim = selectClaimByReward("non-existent", userId)(state);
        expect(claim).toBeUndefined();
      });
    });

    describe("selectUserPendingClaims", () => {
      it("should return pending claims for specific user", () => {
        const state = store.getState() as unknown as RootState;
        const userClaims = selectUserPendingClaims(userId)(state);
        expect(userClaims).toHaveLength(1);
        expect(userClaims[0].memberId).toBe(userId);
        expect(userClaims[0].status).toBe("pending");
      });

      it("should return empty array when user has no pending claims", () => {
        const state = store.getState() as unknown as RootState;
        const userClaims = selectUserPendingClaims("other-user")(state);
        expect(userClaims).toHaveLength(0);
      });
    });
  });
});
