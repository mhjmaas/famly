import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  addShoppingListItem as apiAddItem,
  createShoppingList as apiCreateList,
  deleteShoppingListItem as apiDeleteItem,
  deleteShoppingList as apiDeleteList,
  updateShoppingListItem as apiUpdateItem,
  updateShoppingList as apiUpdateList,
  getShoppingLists,
} from "@/lib/api-client";
import type {
  AddShoppingListItemRequest,
  CreateShoppingListRequest,
  ShoppingList,
  UpdateShoppingListItemRequest,
  UpdateShoppingListRequest,
} from "@/types/api.types";
import type { RootState } from "../store";

interface ShoppingListsState {
  lists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}

const initialState: ShoppingListsState = {
  lists: [],
  isLoading: false,
  error: null,
  lastFetch: null,
};

const replaceListInState = (
  state: ShoppingListsState,
  updatedList: ShoppingList,
) => {
  const index = state.lists.findIndex((l) => l._id === updatedList._id);
  if (index !== -1) {
    state.lists[index] = updatedList;
  }
};

// Async thunks

export const fetchShoppingLists = createAsyncThunk(
  "shoppingLists/fetchShoppingLists",
  async (familyId: string) => {
    const lists = await getShoppingLists(familyId);
    return { lists, timestamp: Date.now() };
  },
);

export const createShoppingList = createAsyncThunk(
  "shoppingLists/createShoppingList",
  async ({
    familyId,
    data,
  }: {
    familyId: string;
    data: CreateShoppingListRequest;
  }) => {
    const list = await apiCreateList(familyId, data);
    return list;
  },
);

export const updateShoppingList = createAsyncThunk(
  "shoppingLists/updateShoppingList",
  async ({
    familyId,
    listId,
    data,
  }: {
    familyId: string;
    listId: string;
    data: UpdateShoppingListRequest;
  }) => {
    const list = await apiUpdateList(familyId, listId, data);
    return list;
  },
);

export const deleteShoppingList = createAsyncThunk(
  "shoppingLists/deleteShoppingList",
  async ({ familyId, listId }: { familyId: string; listId: string }) => {
    await apiDeleteList(familyId, listId);
    return listId;
  },
);

export const addItem = createAsyncThunk(
  "shoppingLists/addItem",
  async ({
    familyId,
    listId,
    data,
  }: {
    familyId: string;
    listId: string;
    data: AddShoppingListItemRequest;
  }) => {
    const list = await apiAddItem(familyId, listId, data);
    return list;
  },
);

export const updateItem = createAsyncThunk(
  "shoppingLists/updateItem",
  async ({
    familyId,
    listId,
    itemId,
    data,
  }: {
    familyId: string;
    listId: string;
    itemId: string;
    data: UpdateShoppingListItemRequest;
  }) => {
    const list = await apiUpdateItem(familyId, listId, itemId, data);
    return list;
  },
);

export const deleteItem = createAsyncThunk(
  "shoppingLists/deleteItem",
  async ({
    familyId,
    listId,
    itemId,
  }: {
    familyId: string;
    listId: string;
    itemId: string;
  }) => {
    const list = await apiDeleteItem(familyId, listId, itemId);
    return list;
  },
);

const shoppingListsSlice = createSlice({
  name: "shoppingLists",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch shopping lists
    builder
      .addCase(fetchShoppingLists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShoppingLists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lists = action.payload.lists;
        state.lastFetch = action.payload.timestamp;
      })
      .addCase(fetchShoppingLists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch shopping lists";
      });

    // Create shopping list
    builder
      .addCase(createShoppingList.pending, (state) => {
        state.error = null;
      })
      .addCase(createShoppingList.fulfilled, (state, action) => {
        state.lists.unshift(action.payload);
      })
      .addCase(createShoppingList.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create shopping list";
      });

    // Update shopping list
    builder
      .addCase(updateShoppingList.fulfilled, (state, action) => {
        replaceListInState(state, action.payload);
      })
      .addCase(updateShoppingList.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update shopping list";
      });

    // Delete shopping list
    builder
      .addCase(deleteShoppingList.fulfilled, (state, action) => {
        state.lists = state.lists.filter((l) => l._id !== action.payload);
      })
      .addCase(deleteShoppingList.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete shopping list";
      });

    // Add item
    builder
      .addCase(addItem.fulfilled, (state, action) => {
        replaceListInState(state, action.payload);
      })
      .addCase(addItem.rejected, (state, action) => {
        state.error = action.error.message || "Failed to add item";
      });

    // Update item
    builder
      .addCase(updateItem.fulfilled, (state, action) => {
        replaceListInState(state, action.payload);
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update item";
      });

    // Delete item
    builder
      .addCase(deleteItem.fulfilled, (state, action) => {
        replaceListInState(state, action.payload);
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete item";
      });
  },
});

export const { clearError } = shoppingListsSlice.actions;
export default shoppingListsSlice.reducer;

// Selectors
export const selectShoppingLists = (state: RootState) =>
  state.shoppingLists.lists;
export const selectShoppingListsLoading = (state: RootState) =>
  state.shoppingLists.isLoading;
export const selectShoppingListsError = (state: RootState) =>
  state.shoppingLists.error;
export const selectShoppingListById = (listId: string) => (state: RootState) =>
  state.shoppingLists.lists.find((l) => l._id === listId);
