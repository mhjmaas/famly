import { configureStore } from "@reduxjs/toolkit";
import * as apiClient from "@/lib/api-client";
import diaryReducer, {
  clearEntries,
  clearError,
  createDiaryEntry,
  deleteDiaryEntry,
  fetchDiaryEntries,
  selectDiaryEntries,
  selectDiaryEntryById,
  selectDiaryError,
  selectDiaryLastFetch,
  selectDiaryLoading,
  updateDiaryEntry,
} from "@/store/slices/diary.slice";
import type { DiaryEntry } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("diary slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        diary: diaryReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().diary;
      expect(state).toEqual({
        entries: [],
        isLoading: false,
        error: null,
        lastFetch: null,
      });
    });
  });

  describe("fetchDiaryEntries thunk", () => {
    it("should fetch diary entries successfully", async () => {
      const mockEntries: DiaryEntry[] = [
        {
          _id: "entry-1",
          date: "2025-01-27",
          entry: "Test diary entry",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-27T10:00:00Z",
          updatedAt: "2025-01-27T10:00:00Z",
        },
      ];

      mockApiClient.getDiaryEntries.mockResolvedValueOnce(mockEntries);

      await store.dispatch(fetchDiaryEntries());

      const state = store.getState().diary;
      expect(state.entries).toEqual(mockEntries);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastFetch).toBeGreaterThan(0);
    });

    it("should fetch diary entries with date filters", async () => {
      const mockEntries: DiaryEntry[] = [];
      mockApiClient.getDiaryEntries.mockResolvedValueOnce(mockEntries);

      await store.dispatch(
        fetchDiaryEntries({ startDate: "2025-01-01", endDate: "2025-01-31" }),
      );

      expect(mockApiClient.getDiaryEntries).toHaveBeenCalledWith(
        "2025-01-01",
        "2025-01-31",
      );
    });

    it("should handle fetch error", async () => {
      mockApiClient.getDiaryEntries.mockRejectedValueOnce(
        new Error("Network error"),
      );

      await store.dispatch(fetchDiaryEntries());

      const state = store.getState().diary;
      expect(state.entries).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("should set loading state during fetch", () => {
      mockApiClient.getDiaryEntries.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      store.dispatch(fetchDiaryEntries());

      const state = store.getState().diary;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("createDiaryEntry thunk", () => {
    it("should create diary entry successfully", async () => {
      const newEntry: DiaryEntry = {
        _id: "entry-2",
        date: "2025-01-27",
        entry: "New diary entry",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-27T15:00:00Z",
        updatedAt: "2025-01-27T15:00:00Z",
      };

      mockApiClient.createDiaryEntry.mockResolvedValueOnce(newEntry);

      await store.dispatch(
        createDiaryEntry({ date: "2025-01-27", entry: "New diary entry" }),
      );

      const state = store.getState().diary;
      expect(state.entries).toContainEqual(newEntry);
      expect(state.error).toBe(null);
    });

    it("should add new entry to beginning of list", async () => {
      // First, populate with existing entries
      const existingEntry: DiaryEntry = {
        _id: "entry-1",
        date: "2025-01-26",
        entry: "Existing entry",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-26T10:00:00Z",
        updatedAt: "2025-01-26T10:00:00Z",
      };

      mockApiClient.getDiaryEntries.mockResolvedValueOnce([existingEntry]);
      await store.dispatch(fetchDiaryEntries());

      const newEntry: DiaryEntry = {
        _id: "entry-2",
        date: "2025-01-27",
        entry: "New entry",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-27T15:00:00Z",
        updatedAt: "2025-01-27T15:00:00Z",
      };

      mockApiClient.createDiaryEntry.mockResolvedValueOnce(newEntry);
      await store.dispatch(
        createDiaryEntry({ date: "2025-01-27", entry: "New entry" }),
      );

      const state = store.getState().diary;
      expect(state.entries[0]).toEqual(newEntry);
      expect(state.entries[1]).toEqual(existingEntry);
    });

    it("should handle create error", async () => {
      mockApiClient.createDiaryEntry.mockRejectedValueOnce(
        new Error("Creation failed"),
      );

      await store.dispatch(
        createDiaryEntry({ date: "2025-01-27", entry: "Failed entry" }),
      );

      const state = store.getState().diary;
      expect(state.error).toBe("Creation failed");
    });

    it("should clear error on pending create", async () => {
      // First set an error
      mockApiClient.getDiaryEntries.mockRejectedValueOnce(
        new Error("Previous error"),
      );
      await store.dispatch(fetchDiaryEntries());

      let state = store.getState().diary;
      expect(state.error).toBe("Previous error");

      // Now start a create - error should be cleared
      mockApiClient.createDiaryEntry.mockReturnValueOnce(new Promise(() => {}));
      store.dispatch(
        createDiaryEntry({ date: "2025-01-27", entry: "New entry" }),
      );

      state = store.getState().diary;
      expect(state.error).toBe(null);
    });
  });

  describe("updateDiaryEntry thunk", () => {
    beforeEach(async () => {
      const existingEntry: DiaryEntry = {
        _id: "entry-1",
        date: "2025-01-27",
        entry: "Original content",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-27T10:00:00Z",
        updatedAt: "2025-01-27T10:00:00Z",
      };

      mockApiClient.getDiaryEntries.mockResolvedValueOnce([existingEntry]);
      await store.dispatch(fetchDiaryEntries());
    });

    it("should update diary entry successfully", async () => {
      const updatedEntry: DiaryEntry = {
        _id: "entry-1",
        date: "2025-01-27",
        entry: "Updated content",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-27T10:00:00Z",
        updatedAt: "2025-01-27T15:00:00Z",
      };

      mockApiClient.updateDiaryEntry.mockResolvedValueOnce(updatedEntry);

      await store.dispatch(
        updateDiaryEntry({
          entryId: "entry-1",
          data: { entry: "Updated content" },
        }),
      );

      const state = store.getState().diary;
      const entry = state.entries.find((e) => e._id === "entry-1");
      expect(entry?.entry).toBe("Updated content");
    });

    it("should handle update error", async () => {
      mockApiClient.updateDiaryEntry.mockRejectedValueOnce(
        new Error("Update failed"),
      );

      await store.dispatch(
        updateDiaryEntry({
          entryId: "entry-1",
          data: { entry: "Failed update" },
        }),
      );

      const state = store.getState().diary;
      expect(state.error).toBe("Update failed");
    });

    it("should not update entry when entry not found in state", async () => {
      const updatedEntry: DiaryEntry = {
        _id: "nonexistent-entry",
        date: "2025-01-27",
        entry: "Updated content",
        isPersonal: true,
        createdBy: "user-1",
        createdAt: "2025-01-27T10:00:00Z",
        updatedAt: "2025-01-27T15:00:00Z",
      };

      mockApiClient.updateDiaryEntry.mockResolvedValueOnce(updatedEntry);

      await store.dispatch(
        updateDiaryEntry({
          entryId: "nonexistent-entry",
          data: { entry: "Updated content" },
        }),
      );

      const state = store.getState().diary;
      expect(state.entries).toHaveLength(1);
      expect(state.entries[0]._id).toBe("entry-1");
    });
  });

  describe("deleteDiaryEntry thunk", () => {
    beforeEach(async () => {
      const entries: DiaryEntry[] = [
        {
          _id: "entry-1",
          date: "2025-01-27",
          entry: "Entry 1",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-27T10:00:00Z",
          updatedAt: "2025-01-27T10:00:00Z",
        },
        {
          _id: "entry-2",
          date: "2025-01-26",
          entry: "Entry 2",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-26T10:00:00Z",
          updatedAt: "2025-01-26T10:00:00Z",
        },
      ];

      mockApiClient.getDiaryEntries.mockResolvedValueOnce(entries);
      await store.dispatch(fetchDiaryEntries());
    });

    it("should delete diary entry successfully", async () => {
      mockApiClient.deleteDiaryEntry.mockResolvedValueOnce(undefined);

      await store.dispatch(deleteDiaryEntry("entry-1"));

      const state = store.getState().diary;
      expect(state.entries.find((e) => e._id === "entry-1")).toBeUndefined();
      expect(state.entries).toHaveLength(1);
    });

    it("should handle delete error", async () => {
      mockApiClient.deleteDiaryEntry.mockRejectedValueOnce(
        new Error("Delete failed"),
      );

      await store.dispatch(deleteDiaryEntry("entry-1"));

      const state = store.getState().diary;
      expect(state.error).toBe("Delete failed");
    });
  });

  describe("reducers", () => {
    it("clearError should clear error state", async () => {
      mockApiClient.getDiaryEntries.mockRejectedValueOnce(
        new Error("Test error"),
      );
      await store.dispatch(fetchDiaryEntries());

      let state = store.getState().diary;
      expect(state.error).toBe("Test error");

      store.dispatch(clearError());

      state = store.getState().diary;
      expect(state.error).toBe(null);
    });

    it("clearEntries should clear entries and lastFetch", async () => {
      const entries: DiaryEntry[] = [
        {
          _id: "entry-1",
          date: "2025-01-27",
          entry: "Test entry",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-27T10:00:00Z",
          updatedAt: "2025-01-27T10:00:00Z",
        },
      ];

      mockApiClient.getDiaryEntries.mockResolvedValueOnce(entries);
      await store.dispatch(fetchDiaryEntries());

      let state = store.getState().diary;
      expect(state.entries).toHaveLength(1);
      expect(state.lastFetch).not.toBe(null);

      store.dispatch(clearEntries());

      state = store.getState().diary;
      expect(state.entries).toEqual([]);
      expect(state.lastFetch).toBe(null);
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      const entries: DiaryEntry[] = [
        {
          _id: "entry-1",
          date: "2025-01-27",
          entry: "Entry 1",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-27T10:00:00Z",
          updatedAt: "2025-01-27T10:00:00Z",
        },
        {
          _id: "entry-2",
          date: "2025-01-26",
          entry: "Entry 2",
          isPersonal: true,
          createdBy: "user-1",
          createdAt: "2025-01-26T10:00:00Z",
          updatedAt: "2025-01-26T10:00:00Z",
        },
      ];

      mockApiClient.getDiaryEntries.mockResolvedValueOnce(entries);
      await store.dispatch(fetchDiaryEntries());
    });

    it("selectDiaryEntries should return all entries", () => {
      const state = store.getState();
      const entries = selectDiaryEntries(state);
      expect(entries).toHaveLength(2);
    });

    it("selectDiaryLoading should return loading state", () => {
      const state = store.getState();
      const isLoading = selectDiaryLoading(state);
      expect(typeof isLoading).toBe("boolean");
      expect(isLoading).toBe(false);
    });

    it("selectDiaryError should return error state", () => {
      const state = store.getState();
      const error = selectDiaryError(state);
      expect(error).toBe(null);
    });

    it("selectDiaryLastFetch should return lastFetch timestamp", () => {
      const state = store.getState();
      const lastFetch = selectDiaryLastFetch(state);
      expect(typeof lastFetch).toBe("number");
      expect(lastFetch).toBeGreaterThan(0);
    });

    it("selectDiaryEntryById should return specific entry", () => {
      const state = store.getState();
      const entry = selectDiaryEntryById("entry-1")(state);
      expect(entry?.entry).toBe("Entry 1");
    });

    it("selectDiaryEntryById should return undefined for non-existent entry", () => {
      const state = store.getState();
      const entry = selectDiaryEntryById("non-existent")(state);
      expect(entry).toBeUndefined();
    });
  });

  describe("pending handlers", () => {
    it("should set loading state when fetching entries", () => {
      mockApiClient.getDiaryEntries.mockReturnValueOnce(new Promise(() => {}));

      store.dispatch(fetchDiaryEntries());

      const state = store.getState().diary;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("error handling edge cases", () => {
    it("should handle error without message", async () => {
      mockApiClient.getDiaryEntries.mockRejectedValueOnce({});

      await store.dispatch(fetchDiaryEntries());

      const state = store.getState().diary;
      expect(state.error).toBe("Failed to fetch diary entries");
    });

    it("should handle create error without message", async () => {
      mockApiClient.createDiaryEntry.mockRejectedValueOnce({});

      await store.dispatch(
        createDiaryEntry({ date: "2025-01-27", entry: "Test" }),
      );

      const state = store.getState().diary;
      expect(state.error).toBe("Failed to create diary entry");
    });

    it("should handle update error without message", async () => {
      mockApiClient.updateDiaryEntry.mockRejectedValueOnce({});

      await store.dispatch(
        updateDiaryEntry({ entryId: "entry-1", data: { entry: "Test" } }),
      );

      const state = store.getState().diary;
      expect(state.error).toBe("Failed to update diary entry");
    });

    it("should handle delete error without message", async () => {
      mockApiClient.deleteDiaryEntry.mockRejectedValueOnce({});

      await store.dispatch(deleteDiaryEntry("entry-1"));

      const state = store.getState().diary;
      expect(state.error).toBe("Failed to delete diary entry");
    });
  });
});
