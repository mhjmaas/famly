import { configureStore } from "@reduxjs/toolkit";
import karmaReducer, {
  setKarma,
  incrementKarma,
  decrementKarma,
  fetchKarma,
  selectKarmaBalance,
  selectKarmaLoading,
  selectKarmaError,
} from "@/store/slices/karma.slice";
import type { RootState } from "@/store/store";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getKarmaBalance: jest.fn(),
}));

import { getKarmaBalance } from "@/lib/api-client";

const mockedGetKarmaBalance = getKarmaBalance as jest.MockedFunction<
  typeof getKarmaBalance
>;

interface TestRootState {
  karma: ReturnType<typeof karmaReducer>;
}

describe("karma.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  const userId = "user-123";
  const familyId = "family-123";
  const mockBalance = 150;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        karma: karmaReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().karma;
      expect(state.balances).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("setKarma action", () => {
    it("should set karma balance for a user", () => {
      store.dispatch(setKarma({ userId, balance: mockBalance }));
      const state = store.getState().karma;

      expect(state.balances[userId]).toBe(mockBalance);
    });

    it("should update existing karma balance", () => {
      // Set initial balance
      store.dispatch(setKarma({ userId, balance: 100 }));
      expect(store.getState().karma.balances[userId]).toBe(100);

      // Update balance
      store.dispatch(setKarma({ userId, balance: 200 }));
      expect(store.getState().karma.balances[userId]).toBe(200);
    });

    it("should handle multiple users", () => {
      const user1 = "user-1";
      const user2 = "user-2";

      store.dispatch(setKarma({ userId: user1, balance: 100 }));
      store.dispatch(setKarma({ userId: user2, balance: 200 }));

      const state = store.getState().karma;
      expect(state.balances[user1]).toBe(100);
      expect(state.balances[user2]).toBe(200);
    });
  });

  describe("incrementKarma action", () => {
    it("should increment karma balance", () => {
      // Set initial balance
      store.dispatch(setKarma({ userId, balance: 100 }));

      // Increment
      store.dispatch(incrementKarma({ userId, amount: 50 }));

      expect(store.getState().karma.balances[userId]).toBe(150);
    });

    it("should handle incrementing from zero", () => {
      store.dispatch(incrementKarma({ userId, amount: 50 }));
      expect(store.getState().karma.balances[userId]).toBe(50);
    });

    it("should handle multiple increments", () => {
      store.dispatch(incrementKarma({ userId, amount: 25 }));
      store.dispatch(incrementKarma({ userId, amount: 25 }));
      store.dispatch(incrementKarma({ userId, amount: 50 }));

      expect(store.getState().karma.balances[userId]).toBe(100);
    });
  });

  describe("decrementKarma action", () => {
    it("should decrement karma balance", () => {
      // Set initial balance
      store.dispatch(setKarma({ userId, balance: 100 }));

      // Decrement
      store.dispatch(decrementKarma({ userId, amount: 30 }));

      expect(store.getState().karma.balances[userId]).toBe(70);
    });

    it("should not go below zero", () => {
      store.dispatch(setKarma({ userId, balance: 50 }));
      store.dispatch(decrementKarma({ userId, amount: 100 }));

      expect(store.getState().karma.balances[userId]).toBe(0);
    });

    it("should handle decrementing from zero", () => {
      store.dispatch(decrementKarma({ userId, amount: 50 }));
      expect(store.getState().karma.balances[userId]).toBe(0);
    });

    it("should handle multiple decrements", () => {
      store.dispatch(setKarma({ userId, balance: 100 }));
      store.dispatch(decrementKarma({ userId, amount: 20 }));
      store.dispatch(decrementKarma({ userId, amount: 30 }));

      expect(store.getState().karma.balances[userId]).toBe(50);
    });
  });

  describe("fetchKarma async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchKarma({ familyId, userId }));
      const state = store.getState().karma;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set karma balance when fulfilled", async () => {
      mockedGetKarmaBalance.mockResolvedValueOnce({
        userId,
        familyId,
        balance: mockBalance,
        lastUpdated: "2024-01-01T00:00:00Z",
      });

      await store.dispatch(fetchKarma({ familyId, userId }));
      const state = store.getState().karma;

      expect(state.isLoading).toBe(false);
      expect(state.balances[userId]).toBe(mockBalance);
      expect(state.error).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch karma";
      mockedGetKarmaBalance.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchKarma({ familyId, userId }));
      const state = store.getState().karma;

      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetKarmaBalance.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchKarma({ familyId, userId }));
      const state = store.getState().karma;

      expect(state.error).toBe("Failed to fetch karma");
    });
  });

  describe("selectors", () => {
    describe("selectKarmaBalance", () => {
      it("should return karma balance for user", () => {
        store.dispatch(setKarma({ userId, balance: mockBalance }));
        const state = store.getState() as unknown as RootState;

        expect(selectKarmaBalance(userId)(state)).toBe(mockBalance);
      });

      it("should return 0 when user has no balance", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectKarmaBalance(userId)(state)).toBe(0);
      });

      it("should return correct balance for different users", () => {
        const user1 = "user-1";
        const user2 = "user-2";

        store.dispatch(setKarma({ userId: user1, balance: 100 }));
        store.dispatch(setKarma({ userId: user2, balance: 200 }));

        const state = store.getState() as unknown as RootState;
        expect(selectKarmaBalance(user1)(state)).toBe(100);
        expect(selectKarmaBalance(user2)(state)).toBe(200);
      });
    });

    describe("selectKarmaLoading", () => {
      it("should return loading state", () => {
        store.dispatch(fetchKarma({ familyId, userId }));
        const state = store.getState() as unknown as RootState;

        expect(selectKarmaLoading(state)).toBe(true);
      });

      it("should return false when not loading", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectKarmaLoading(state)).toBe(false);
      });
    });

    describe("selectKarmaError", () => {
      it("should return error message", async () => {
        const errorMessage = "Test error";
        mockedGetKarmaBalance.mockRejectedValueOnce(new Error(errorMessage));

        await store.dispatch(fetchKarma({ familyId, userId }));
        const state = store.getState() as unknown as RootState;

        expect(selectKarmaError(state)).toBe(errorMessage);
      });

      it("should return null when no error", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectKarmaError(state)).toBeNull();
      });
    });
  });

  describe("state transitions", () => {
    it("should handle complex karma operations", async () => {
      // Set initial balance
      store.dispatch(setKarma({ userId, balance: 100 }));
      expect(store.getState().karma.balances[userId]).toBe(100);

      // Increment
      store.dispatch(incrementKarma({ userId, amount: 50 }));
      expect(store.getState().karma.balances[userId]).toBe(150);

      // Decrement
      store.dispatch(decrementKarma({ userId, amount: 30 }));
      expect(store.getState().karma.balances[userId]).toBe(120);

      // Fetch from API
      mockedGetKarmaBalance.mockResolvedValueOnce({
        userId,
        familyId,
        balance: 200,
        lastUpdated: "2024-01-01T00:00:00Z",
      });
      await store.dispatch(fetchKarma({ familyId, userId }));
      expect(store.getState().karma.balances[userId]).toBe(200);
      expect(store.getState().karma.error).toBeNull();
    });

    it("should handle operations on multiple users", () => {
      const user1 = "user-1";
      const user2 = "user-2";

      store.dispatch(setKarma({ userId: user1, balance: 100 }));
      store.dispatch(setKarma({ userId: user2, balance: 50 }));

      store.dispatch(incrementKarma({ userId: user1, amount: 25 }));
      store.dispatch(decrementKarma({ userId: user2, amount: 10 }));

      expect(store.getState().karma.balances[user1]).toBe(125);
      expect(store.getState().karma.balances[user2]).toBe(40);
    });
  });
});
