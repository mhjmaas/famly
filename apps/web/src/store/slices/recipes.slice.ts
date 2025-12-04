import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  createRecipe as apiCreateRecipe,
  deleteRecipe as apiDeleteRecipe,
  getRecipe as apiGetRecipe,
  searchRecipes as apiSearchRecipes,
  updateRecipe as apiUpdateRecipe,
  getRecipes,
} from "@/lib/api-client";
import type {
  CreateRecipeRequest,
  Recipe,
  UpdateRecipeRequest,
} from "@/types/api.types";
import type { RootState } from "../store";

interface RecipesState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  stepProgress: Record<string, boolean>; // "recipeId-stepIndex" -> completed
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: Recipe[];
  isSearching: boolean;
}

const initialState: RecipesState = {
  recipes: [],
  currentRecipe: null,
  stepProgress: {},
  isLoading: false,
  error: null,
  searchQuery: "",
  searchResults: [],
  isSearching: false,
};

// Helper to replace a recipe in state
const replaceRecipeInState = (state: RecipesState, updatedRecipe: Recipe) => {
  const index = state.recipes.findIndex((r) => r._id === updatedRecipe._id);
  if (index !== -1) {
    state.recipes[index] = updatedRecipe;
  }
  if (state.currentRecipe?._id === updatedRecipe._id) {
    state.currentRecipe = updatedRecipe;
  }
};

// Async thunks

export const fetchRecipes = createAsyncThunk(
  "recipes/fetchRecipes",
  async (familyId: string) => {
    const recipes = await getRecipes(familyId);
    return recipes;
  },
);

export const fetchRecipe = createAsyncThunk(
  "recipes/fetchRecipe",
  async ({ familyId, recipeId }: { familyId: string; recipeId: string }) => {
    const recipe = await apiGetRecipe(familyId, recipeId);
    return recipe;
  },
);

export const createRecipe = createAsyncThunk(
  "recipes/createRecipe",
  async ({
    familyId,
    data,
  }: {
    familyId: string;
    data: CreateRecipeRequest;
  }) => {
    const recipe = await apiCreateRecipe(familyId, data);
    return recipe;
  },
);

export const updateRecipe = createAsyncThunk(
  "recipes/updateRecipe",
  async ({
    familyId,
    recipeId,
    data,
  }: {
    familyId: string;
    recipeId: string;
    data: UpdateRecipeRequest;
  }) => {
    const recipe = await apiUpdateRecipe(familyId, recipeId, data);
    return recipe;
  },
);

export const deleteRecipe = createAsyncThunk(
  "recipes/deleteRecipe",
  async ({ familyId, recipeId }: { familyId: string; recipeId: string }) => {
    await apiDeleteRecipe(familyId, recipeId);
    return recipeId;
  },
);

export const searchRecipes = createAsyncThunk(
  "recipes/searchRecipes",
  async ({ familyId, query }: { familyId: string; query: string }) => {
    const recipes = await apiSearchRecipes(familyId, query);
    return { recipes, query };
  },
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
      if (!action.payload) {
        state.searchResults = [];
      }
    },
    toggleStepComplete: (
      state,
      action: PayloadAction<{ recipeId: string; stepIndex: number }>,
    ) => {
      const key = `${action.payload.recipeId}-${action.payload.stepIndex}`;
      state.stepProgress[key] = !state.stepProgress[key];
    },
    resetStepProgress: (state, action: PayloadAction<string>) => {
      const recipeId = action.payload;
      // Remove all step progress entries for this recipe
      const keysToRemove = Object.keys(state.stepProgress).filter((key) =>
        key.startsWith(`${recipeId}-`),
      );
      for (const key of keysToRemove) {
        delete state.stepProgress[key];
      }
    },
    clearCurrentRecipe: (state) => {
      state.currentRecipe = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch recipes
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recipes = action.payload;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch recipes";
      });

    // Fetch single recipe
    builder
      .addCase(fetchRecipe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecipe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRecipe = action.payload;
        // Also update in recipes array if present
        replaceRecipeInState(state, action.payload);
      })
      .addCase(fetchRecipe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch recipe";
      });

    // Create recipe
    builder
      .addCase(createRecipe.pending, (state) => {
        state.error = null;
      })
      .addCase(createRecipe.fulfilled, (state, action) => {
        state.recipes.unshift(action.payload);
      })
      .addCase(createRecipe.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create recipe";
      });

    // Update recipe
    builder
      .addCase(updateRecipe.fulfilled, (state, action) => {
        replaceRecipeInState(state, action.payload);
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update recipe";
      });

    // Delete recipe
    builder
      .addCase(deleteRecipe.fulfilled, (state, action) => {
        state.recipes = state.recipes.filter((r) => r._id !== action.payload);
        if (state.currentRecipe?._id === action.payload) {
          state.currentRecipe = null;
        }
        // Clear step progress for deleted recipe
        const keysToRemove = Object.keys(state.stepProgress).filter((key) =>
          key.startsWith(`${action.payload}-`),
        );
        for (const key of keysToRemove) {
          delete state.stepProgress[key];
        }
      })
      .addCase(deleteRecipe.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete recipe";
      });

    // Search recipes
    builder
      .addCase(searchRecipes.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchRecipes.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.recipes;
        state.searchQuery = action.payload.query;
      })
      .addCase(searchRecipes.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || "Failed to search recipes";
      });
  },
});

export const {
  clearError,
  setSearchQuery,
  toggleStepComplete,
  resetStepProgress,
  clearCurrentRecipe,
} = recipesSlice.actions;

export default recipesSlice.reducer;

// Selectors
export const selectRecipes = (state: RootState) => state.recipes.recipes;
export const selectCurrentRecipe = (state: RootState) =>
  state.recipes.currentRecipe;
export const selectRecipesLoading = (state: RootState) =>
  state.recipes.isLoading;
export const selectRecipesError = (state: RootState) => state.recipes.error;
export const selectSearchQuery = (state: RootState) =>
  state.recipes.searchQuery;
export const selectSearchResults = (state: RootState) =>
  state.recipes.searchResults;
export const selectIsSearching = (state: RootState) =>
  state.recipes.isSearching;
export const selectStepProgress = (state: RootState) =>
  state.recipes.stepProgress;

export const selectRecipeById = (recipeId: string) => (state: RootState) =>
  state.recipes.recipes.find((r) => r._id === recipeId);

export const selectStepComplete =
  (recipeId: string, stepIndex: number) => (state: RootState) =>
    state.recipes.stepProgress[`${recipeId}-${stepIndex}`] || false;

export const selectCompletedStepsCount =
  (recipeId: string, totalSteps: number) => (state: RootState) => {
    let count = 0;
    for (let i = 0; i < totalSteps; i++) {
      if (state.recipes.stepProgress[`${recipeId}-${i}`]) {
        count++;
      }
    }
    return count;
  };
