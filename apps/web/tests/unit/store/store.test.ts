import type { UserProfile } from "@/lib/api-client";
import { setKarma } from "@/store/slices/karma.slice";
import { setUser } from "@/store/slices/user.slice";
import {
  type AppDispatch,
  type AppStore,
  makeStore,
  type RootState,
} from "@/store/store";

describe("store", () => {
  let store: AppStore;

  const mockUserProfile: UserProfile = {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    birthdate: "1990-01-01",
    emailVerified: true,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    families: [
      {
        familyId: "family-123",
        name: "Test Family",
        role: "parent",
        linkedAt: "2024-01-01T00:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    store = makeStore();
  });

  describe("makeStore", () => {
    it("should create a store with correct initial state", () => {
      const state = store.getState();

      expect(state.user).toBeDefined();
      expect(state.karma).toBeDefined();
      expect(state.user.profile).toBeNull();
      expect(state.karma.balances).toEqual({});
    });

    it("should create a store with preloaded state", () => {
      const preloadedState: Partial<RootState> = {
        user: {
          profile: mockUserProfile,
          isLoading: false,
          error: null,
        },
        karma: {
          balances: { "user-123": 150 },
          isLoading: false,
          error: null,
        },
      };

      const storeWithPreload = makeStore(preloadedState);
      const state = storeWithPreload.getState();

      expect(state.user.profile).toEqual(mockUserProfile);
      expect(state.karma.balances["user-123"]).toBe(150);
    });

    it("should create a store with partial preloaded state", () => {
      const preloadedState: Partial<RootState> = {
        user: {
          profile: mockUserProfile,
          isLoading: false,
          error: null,
        },
      };

      const storeWithPreload = makeStore(preloadedState);
      const state = storeWithPreload.getState();

      expect(state.user.profile).toEqual(mockUserProfile);
      expect(state.karma.balances).toEqual({});
    });
  });

  describe("store integration", () => {
    it("should handle user slice actions", () => {
      store.dispatch(setUser(mockUserProfile));
      const state = store.getState();

      expect(state.user.profile).toEqual(mockUserProfile);
    });

    it("should handle karma slice actions", () => {
      store.dispatch(setKarma({ userId: "user-123", balance: 100 }));
      const state = store.getState();

      expect(state.karma.balances["user-123"]).toBe(100);
    });

    it("should handle multiple slice actions independently", () => {
      store.dispatch(setUser(mockUserProfile));
      store.dispatch(setKarma({ userId: "user-123", balance: 200 }));

      const state = store.getState();
      expect(state.user.profile).toEqual(mockUserProfile);
      expect(state.karma.balances["user-123"]).toBe(200);
    });
  });

  describe("TypeScript types", () => {
    it("should have correct RootState type", () => {
      const state: RootState = store.getState();

      // Type assertions to ensure correct structure
      expect(state.user).toBeDefined();
      expect(state.karma).toBeDefined();
    });

    it("should have correct AppDispatch type", () => {
      const dispatch: AppDispatch = store.dispatch;

      // Dispatch should accept actions
      dispatch(setUser(mockUserProfile));
      expect(store.getState().user.profile).toEqual(mockUserProfile);
    });

    it("should have correct AppStore type", () => {
      const testStore: AppStore = makeStore();

      expect(testStore.getState).toBeDefined();
      expect(testStore.dispatch).toBeDefined();
      expect(testStore.subscribe).toBeDefined();
    });
  });

  describe("Redux DevTools", () => {
    it("should create store successfully", () => {
      const testStore = makeStore();
      // DevTools configuration is handled by configureStore based on NODE_ENV
      // We just verify the store was created successfully
      expect(testStore).toBeDefined();
      expect(testStore.getState).toBeDefined();
      expect(testStore.dispatch).toBeDefined();
    });
  });

  describe("store subscription", () => {
    it("should notify subscribers on state changes", () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      store.dispatch(setUser(mockUserProfile));

      expect(listener).toHaveBeenCalled();

      unsubscribe();
    });

    it("should not notify unsubscribed listeners", () => {
      const listener = jest.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.dispatch(setUser(mockUserProfile));

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
