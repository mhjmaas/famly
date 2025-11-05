import { configureStore } from "@reduxjs/toolkit";
import userReducer, {
  setUser,
  clearUser,
  fetchUser,
  selectUser,
  selectUserLoading,
  selectUserError,
  selectCurrentFamily,
} from "@/store/slices/user.slice";
import type { UserProfile } from "@/lib/api-client";
import type { RootState } from "@/store/store";

// Mock the API client
jest.mock("@/lib/api-client", () => ({
  getMe: jest.fn(),
}));

import { getMe } from "@/lib/api-client";

const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;

interface TestRootState {
  user: ReturnType<typeof userReducer>;
}

describe("user.slice", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

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
    store = configureStore({
      reducer: {
        user: userReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().user;
      expect(state.profile).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("setUser action", () => {
    it("should set user profile", () => {
      store.dispatch(setUser(mockUserProfile));
      const state = store.getState().user;

      expect(state.profile).toEqual(mockUserProfile);
      expect(state.error).toBeNull();
    });

    it("should clear error when setting user", () => {
      // First set an error state
      store.dispatch(fetchUser.rejected(new Error("Test error"), ""));
      expect(store.getState().user.error).toBeTruthy();

      // Then set user
      store.dispatch(setUser(mockUserProfile));
      expect(store.getState().user.error).toBeNull();
    });
  });

  describe("clearUser action", () => {
    it("should clear user profile", () => {
      // First set a user
      store.dispatch(setUser(mockUserProfile));
      expect(store.getState().user.profile).toEqual(mockUserProfile);

      // Then clear
      store.dispatch(clearUser());
      const state = store.getState().user;

      expect(state.profile).toBeNull();
      expect(state.error).toBeNull();
    });

    it("should clear error when clearing user", () => {
      // Set error state
      store.dispatch(fetchUser.rejected(new Error("Test error"), ""));
      expect(store.getState().user.error).toBeTruthy();

      // Clear user
      store.dispatch(clearUser());
      expect(store.getState().user.error).toBeNull();
    });
  });

  describe("fetchUser async thunk", () => {
    it("should set loading state when pending", () => {
      store.dispatch(fetchUser());
      const state = store.getState().user;

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set user profile when fulfilled", async () => {
      mockedGetMe.mockResolvedValueOnce({
        user: mockUserProfile,
        authType: "cookie",
      });

      await store.dispatch(fetchUser());
      const state = store.getState().user;

      expect(state.isLoading).toBe(false);
      expect(state.profile).toEqual(mockUserProfile);
      expect(state.error).toBeNull();
    });

    it("should set error when rejected", async () => {
      const errorMessage = "Failed to fetch user";
      mockedGetMe.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(fetchUser());
      const state = store.getState().user;

      expect(state.isLoading).toBe(false);
      expect(state.profile).toBeNull();
      expect(state.error).toBe(errorMessage);
    });

    it("should set default error message when error has no message", async () => {
      mockedGetMe.mockRejectedValueOnce(new Error());

      await store.dispatch(fetchUser());
      const state = store.getState().user;

      expect(state.error).toBe("Failed to fetch user");
    });
  });

  describe("selectors", () => {
    describe("selectUser", () => {
      it("should return user profile", () => {
        store.dispatch(setUser(mockUserProfile));
        const state = store.getState() as unknown as RootState;

        expect(selectUser(state)).toEqual(mockUserProfile);
      });

      it("should return null when no user", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectUser(state)).toBeNull();
      });
    });

    describe("selectUserLoading", () => {
      it("should return loading state", () => {
        store.dispatch(fetchUser());
        const state = store.getState() as unknown as RootState;

        expect(selectUserLoading(state)).toBe(true);
      });

      it("should return false when not loading", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectUserLoading(state)).toBe(false);
      });
    });

    describe("selectUserError", () => {
      it("should return error message", async () => {
        const errorMessage = "Test error";
        mockedGetMe.mockRejectedValueOnce(new Error(errorMessage));

        await store.dispatch(fetchUser());
        const state = store.getState() as unknown as RootState;

        expect(selectUserError(state)).toBe(errorMessage);
      });

      it("should return null when no error", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectUserError(state)).toBeNull();
      });
    });

    describe("selectCurrentFamily", () => {
      it("should return first family from user profile", () => {
        store.dispatch(setUser(mockUserProfile));
        const state = store.getState() as unknown as RootState;

        expect(selectCurrentFamily(state)).toEqual(mockUserProfile.families[0]);
      });

      it("should return null when user has no families", () => {
        const userWithoutFamilies: UserProfile = {
          ...mockUserProfile,
          families: [],
        };
        store.dispatch(setUser(userWithoutFamilies));
        const state = store.getState() as unknown as RootState;

        expect(selectCurrentFamily(state)).toBeNull();
      });

      it("should return null when no user", () => {
        const state = store.getState() as unknown as RootState;
        expect(selectCurrentFamily(state)).toBeNull();
      });
    });
  });

  describe("state transitions", () => {
    it("should handle multiple state changes correctly", async () => {
      // Set user manually
      store.dispatch(setUser(mockUserProfile));
      expect(store.getState().user.profile).toEqual(mockUserProfile);
      expect(store.getState().user.isLoading).toBe(false);

      // Clear user
      store.dispatch(clearUser());
      expect(store.getState().user.profile).toBeNull();

      // Fetch user successfully
      mockedGetMe.mockResolvedValueOnce({ user: mockUserProfile, authType: "cookie" });
      await store.dispatch(fetchUser());
      expect(store.getState().user.profile).toEqual(mockUserProfile);
      expect(store.getState().user.error).toBeNull();
    });
  });
});
