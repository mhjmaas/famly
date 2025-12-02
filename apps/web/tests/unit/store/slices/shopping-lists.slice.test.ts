import { configureStore } from "@reduxjs/toolkit";
import * as apiClient from "@/lib/api-client";
import shoppingListsReducer, {
  addItem,
  clearError,
  createShoppingList,
  deleteItem,
  deleteShoppingList,
  fetchShoppingLists,
  selectShoppingListById,
  selectShoppingLists,
  selectShoppingListsError,
  selectShoppingListsLoading,
  updateItem,
  updateShoppingList,
} from "@/store/slices/shopping-lists.slice";
import type { ShoppingList } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("shopping-lists slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        shoppingLists: shoppingListsReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().shoppingLists;
      expect(state).toEqual({
        lists: [],
        isLoading: false,
        error: null,
        lastFetch: null,
      });
    });
  });

  describe("fetchShoppingLists thunk", () => {
    it("should fetch shopping lists successfully", async () => {
      const mockLists: ShoppingList[] = [
        {
          _id: "list-1",
          familyId: "family-1",
          name: "Groceries",
          tags: ["weekly"],
          items: [
            {
              _id: "item-1",
              name: "Milk",
              checked: false,
              createdAt: "2025-01-01T00:00:00Z",
            },
          ],
          createdBy: "user-1",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
      ];

      mockApiClient.getShoppingLists.mockResolvedValueOnce(mockLists);

      await store.dispatch(fetchShoppingLists("family-1"));

      const state = store.getState().shoppingLists;
      expect(state.lists).toEqual(mockLists);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      expect(state.lastFetch).toBeGreaterThan(0);
    });

    it("should handle fetch error", async () => {
      mockApiClient.getShoppingLists.mockRejectedValueOnce(
        new Error("Network error"),
      );

      await store.dispatch(fetchShoppingLists("family-1"));

      const state = store.getState().shoppingLists;
      expect(state.lists).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("should set loading state during fetch", () => {
      mockApiClient.getShoppingLists.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      store.dispatch(fetchShoppingLists("family-1"));

      const state = store.getState().shoppingLists;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("createShoppingList thunk", () => {
    it("should create shopping list successfully", async () => {
      const newList: ShoppingList = {
        _id: "list-2",
        familyId: "family-1",
        name: "Hardware Store",
        tags: ["DIY"],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-15T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.createShoppingList.mockResolvedValueOnce(newList);

      await store.dispatch(
        createShoppingList({
          familyId: "family-1",
          data: { name: "Hardware Store", tags: ["DIY"] },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.lists).toContainEqual(newList);
      expect(state.error).toBe(null);
    });

    it("should handle create error", async () => {
      mockApiClient.createShoppingList.mockRejectedValueOnce(
        new Error("Creation failed"),
      );

      await store.dispatch(
        createShoppingList({
          familyId: "family-1",
          data: { name: "Failed List" },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Creation failed");
    });

    it("should clear error on pending", async () => {
      // First, create an error state
      mockApiClient.createShoppingList.mockRejectedValueOnce(
        new Error("Error"),
      );
      await store.dispatch(
        createShoppingList({ familyId: "family-1", data: { name: "Test" } }),
      );

      // Now dispatch a new create that will clear the error
      mockApiClient.createShoppingList.mockReturnValueOnce(
        new Promise(() => {}),
      );
      store.dispatch(
        createShoppingList({ familyId: "family-1", data: { name: "Test2" } }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe(null);
    });
  });

  describe("updateShoppingList thunk", () => {
    beforeEach(async () => {
      const existingList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Original Name",
        tags: [],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getShoppingLists.mockResolvedValueOnce([existingList]);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("should update shopping list successfully", async () => {
      const updatedList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Updated Name",
        tags: ["updated"],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.updateShoppingList.mockResolvedValueOnce(updatedList);

      await store.dispatch(
        updateShoppingList({
          familyId: "family-1",
          listId: "list-1",
          data: { name: "Updated Name", tags: ["updated"] },
        }),
      );

      const state = store.getState().shoppingLists;
      const list = state.lists.find((l) => l._id === "list-1");
      expect(list?.name).toBe("Updated Name");
      expect(list?.tags).toEqual(["updated"]);
    });

    it("should handle update error", async () => {
      mockApiClient.updateShoppingList.mockRejectedValueOnce(
        new Error("Update failed"),
      );

      await store.dispatch(
        updateShoppingList({
          familyId: "family-1",
          listId: "list-1",
          data: { name: "Failed Update" },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Update failed");
    });

    it("should not update when list not found in state", async () => {
      const updatedList: ShoppingList = {
        _id: "nonexistent-list",
        familyId: "family-1",
        name: "Updated",
        tags: [],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.updateShoppingList.mockResolvedValueOnce(updatedList);

      await store.dispatch(
        updateShoppingList({
          familyId: "family-1",
          listId: "nonexistent-list",
          data: { name: "Updated" },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(
        state.lists.find((l) => l._id === "nonexistent-list"),
      ).toBeUndefined();
    });
  });

  describe("deleteShoppingList thunk", () => {
    beforeEach(async () => {
      const existingList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "To Delete",
        tags: [],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getShoppingLists.mockResolvedValueOnce([existingList]);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("should delete shopping list successfully", async () => {
      mockApiClient.deleteShoppingList.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteShoppingList({ familyId: "family-1", listId: "list-1" }),
      );

      const state = store.getState().shoppingLists;
      expect(state.lists.find((l) => l._id === "list-1")).toBeUndefined();
    });

    it("should handle delete error", async () => {
      mockApiClient.deleteShoppingList.mockRejectedValueOnce(
        new Error("Delete failed"),
      );

      await store.dispatch(
        deleteShoppingList({ familyId: "family-1", listId: "list-1" }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Delete failed");
    });
  });

  describe("addItem thunk", () => {
    beforeEach(async () => {
      const existingList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getShoppingLists.mockResolvedValueOnce([existingList]);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("should add item successfully", async () => {
      const updatedList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [
          {
            _id: "item-1",
            name: "Milk",
            checked: false,
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.addShoppingListItem.mockResolvedValueOnce(updatedList);

      await store.dispatch(
        addItem({
          familyId: "family-1",
          listId: "list-1",
          data: { name: "Milk" },
        }),
      );

      const state = store.getState().shoppingLists;
      const list = state.lists.find((l) => l._id === "list-1");
      expect(list?.items).toHaveLength(1);
      expect(list?.items[0].name).toBe("Milk");
    });

    it("should handle add item error", async () => {
      mockApiClient.addShoppingListItem.mockRejectedValueOnce(
        new Error("Add item failed"),
      );

      await store.dispatch(
        addItem({
          familyId: "family-1",
          listId: "list-1",
          data: { name: "Milk" },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Add item failed");
    });
  });

  describe("updateItem thunk", () => {
    beforeEach(async () => {
      const existingList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [
          {
            _id: "item-1",
            name: "Milk",
            checked: false,
            createdAt: "2025-01-01T00:00:00Z",
          },
        ],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getShoppingLists.mockResolvedValueOnce([existingList]);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("should update item checked status successfully", async () => {
      const updatedList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [
          {
            _id: "item-1",
            name: "Milk",
            checked: true,
            createdAt: "2025-01-01T00:00:00Z",
          },
        ],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.updateShoppingListItem.mockResolvedValueOnce(updatedList);

      await store.dispatch(
        updateItem({
          familyId: "family-1",
          listId: "list-1",
          itemId: "item-1",
          data: { checked: true },
        }),
      );

      const state = store.getState().shoppingLists;
      const list = state.lists.find((l) => l._id === "list-1");
      expect(list?.items[0].checked).toBe(true);
    });

    it("should handle update item error", async () => {
      mockApiClient.updateShoppingListItem.mockRejectedValueOnce(
        new Error("Update item failed"),
      );

      await store.dispatch(
        updateItem({
          familyId: "family-1",
          listId: "list-1",
          itemId: "item-1",
          data: { checked: true },
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Update item failed");
    });
  });

  describe("deleteItem thunk", () => {
    beforeEach(async () => {
      const existingList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [
          {
            _id: "item-1",
            name: "Milk",
            checked: false,
            createdAt: "2025-01-01T00:00:00Z",
          },
        ],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-01T00:00:00Z",
      };

      mockApiClient.getShoppingLists.mockResolvedValueOnce([existingList]);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("should delete item successfully", async () => {
      const updatedList: ShoppingList = {
        _id: "list-1",
        familyId: "family-1",
        name: "Groceries",
        tags: [],
        items: [],
        createdBy: "user-1",
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2025-01-15T00:00:00Z",
      };

      mockApiClient.deleteShoppingListItem.mockResolvedValueOnce(updatedList);

      await store.dispatch(
        deleteItem({
          familyId: "family-1",
          listId: "list-1",
          itemId: "item-1",
        }),
      );

      const state = store.getState().shoppingLists;
      const list = state.lists.find((l) => l._id === "list-1");
      expect(list?.items).toHaveLength(0);
    });

    it("should handle delete item error", async () => {
      mockApiClient.deleteShoppingListItem.mockRejectedValueOnce(
        new Error("Delete item failed"),
      );

      await store.dispatch(
        deleteItem({
          familyId: "family-1",
          listId: "list-1",
          itemId: "item-1",
        }),
      );

      const state = store.getState().shoppingLists;
      expect(state.error).toBe("Delete item failed");
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      const mockLists: ShoppingList[] = [
        {
          _id: "list-1",
          familyId: "family-1",
          name: "List 1",
          tags: [],
          items: [],
          createdBy: "user-1",
          createdAt: "2025-01-01T00:00:00Z",
          updatedAt: "2025-01-01T00:00:00Z",
        },
        {
          _id: "list-2",
          familyId: "family-1",
          name: "List 2",
          tags: ["tag1"],
          items: [],
          createdBy: "user-1",
          createdAt: "2025-01-02T00:00:00Z",
          updatedAt: "2025-01-02T00:00:00Z",
        },
      ];

      mockApiClient.getShoppingLists.mockResolvedValueOnce(mockLists);
      await store.dispatch(fetchShoppingLists("family-1"));
    });

    it("selectShoppingLists should return all lists", () => {
      const state = store.getState();
      const lists = selectShoppingLists(state);
      expect(lists).toHaveLength(2);
    });

    it("selectShoppingListById should return specific list", () => {
      const state = store.getState();
      const list = selectShoppingListById("list-1")(state);
      expect(list?.name).toBe("List 1");
    });

    it("selectShoppingListById should return undefined for non-existent list", () => {
      const state = store.getState();
      const list = selectShoppingListById("non-existent")(state);
      expect(list).toBeUndefined();
    });

    it("selectShoppingListsLoading should return loading state", () => {
      const state = store.getState();
      const isLoading = selectShoppingListsLoading(state);
      expect(typeof isLoading).toBe("boolean");
    });

    it("selectShoppingListsError should return error state", () => {
      const state = store.getState();
      const error = selectShoppingListsError(state);
      expect(error).toBe(null);
    });
  });

  describe("clearError reducer", () => {
    it("should clear error when clearError action is dispatched", async () => {
      mockApiClient.getShoppingLists.mockRejectedValueOnce(
        new Error("Network error"),
      );

      await store.dispatch(fetchShoppingLists("family-1"));

      let state = store.getState().shoppingLists;
      expect(state.error).toBe("Network error");

      store.dispatch(clearError());

      state = store.getState().shoppingLists;
      expect(state.error).toBe(null);
    });
  });
});
