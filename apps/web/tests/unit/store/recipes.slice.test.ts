import { configureStore } from "@reduxjs/toolkit";
import * as apiClient from "@/lib/api-client";
import recipesReducer, {
  clearCurrentRecipe,
  clearError,
  createRecipe,
  deleteRecipe,
  fetchRecipe,
  fetchRecipes,
  resetStepProgress,
  searchRecipes,
  selectCompletedStepsCount,
  selectCurrentRecipe,
  selectIsSearching,
  selectRecipeById,
  selectRecipes,
  selectRecipesError,
  selectRecipesLoading,
  selectSearchQuery,
  selectSearchResults,
  selectStepComplete,
  selectStepProgress,
  setSearchQuery,
  toggleStepComplete,
  updateRecipe,
} from "@/store/slices/recipes.slice";
import type { Recipe } from "@/types/api.types";

// Mock the API client
jest.mock("@/lib/api-client");

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createMockRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  _id: "recipe-1",
  familyId: "family-1",
  name: "Test Recipe",
  description: "A test recipe description",
  durationMinutes: 30,
  steps: ["Step 1", "Step 2", "Step 3"],
  tags: ["dinner", "easy"],
  createdBy: "user-1",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

describe("recipes slice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        recipes: recipesReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have correct initial state", () => {
      const state = store.getState().recipes;
      expect(state).toEqual({
        recipes: [],
        currentRecipe: null,
        stepProgress: {},
        isLoading: false,
        error: null,
        searchQuery: "",
        searchResults: [],
        isSearching: false,
      });
    });
  });

  describe("fetchRecipes thunk", () => {
    it("should fetch recipes successfully", async () => {
      const mockRecipes: Recipe[] = [
        createMockRecipe({ _id: "recipe-1", name: "Recipe 1" }),
        createMockRecipe({ _id: "recipe-2", name: "Recipe 2" }),
      ];

      mockApiClient.getRecipes.mockResolvedValueOnce(mockRecipes);

      await store.dispatch(fetchRecipes("family-1"));

      const state = store.getState().recipes;
      expect(state.recipes).toEqual(mockRecipes);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it("should handle fetch error", async () => {
      mockApiClient.getRecipes.mockRejectedValueOnce(
        new Error("Network error"),
      );

      await store.dispatch(fetchRecipes("family-1"));

      const state = store.getState().recipes;
      expect(state.recipes).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Network error");
    });

    it("should set loading state during fetch", () => {
      mockApiClient.getRecipes.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      store.dispatch(fetchRecipes("family-1"));

      const state = store.getState().recipes;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("fetchRecipe thunk", () => {
    it("should fetch a single recipe successfully", async () => {
      const mockRecipe = createMockRecipe();

      mockApiClient.getRecipe.mockResolvedValueOnce(mockRecipe);

      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.currentRecipe).toEqual(mockRecipe);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it("should update recipe in recipes array if present", async () => {
      const existingRecipe = createMockRecipe({ name: "Old Name" });
      mockApiClient.getRecipes.mockResolvedValueOnce([existingRecipe]);
      await store.dispatch(fetchRecipes("family-1"));

      const updatedRecipe = createMockRecipe({ name: "New Name" });
      mockApiClient.getRecipe.mockResolvedValueOnce(updatedRecipe);

      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.recipes[0].name).toBe("New Name");
      expect(state.currentRecipe?.name).toBe("New Name");
    });

    it("should handle fetch single recipe error", async () => {
      mockApiClient.getRecipe.mockRejectedValueOnce(new Error("Not found"));

      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.currentRecipe).toBe(null);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Not found");
    });

    it("should set loading state during single recipe fetch", () => {
      mockApiClient.getRecipe.mockReturnValueOnce(new Promise(() => {}));

      store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBe(null);
    });
  });

  describe("createRecipe thunk", () => {
    it("should create recipe successfully", async () => {
      const newRecipe = createMockRecipe({
        _id: "recipe-new",
        name: "New Recipe",
      });

      mockApiClient.createRecipe.mockResolvedValueOnce(newRecipe);

      await store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: {
            name: "New Recipe",
            description: "Description",
            steps: ["Step 1"],
          },
        }),
      );

      const state = store.getState().recipes;
      expect(state.recipes).toContainEqual(newRecipe);
      expect(state.error).toBe(null);
    });

    it("should add new recipe at the beginning of the list", async () => {
      const existingRecipe = createMockRecipe({ _id: "recipe-1" });
      mockApiClient.getRecipes.mockResolvedValueOnce([existingRecipe]);
      await store.dispatch(fetchRecipes("family-1"));

      const newRecipe = createMockRecipe({ _id: "recipe-new" });
      mockApiClient.createRecipe.mockResolvedValueOnce(newRecipe);

      await store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: {
            name: "New Recipe",
            description: "Description",
            steps: ["Step 1"],
          },
        }),
      );

      const state = store.getState().recipes;
      expect(state.recipes[0]._id).toBe("recipe-new");
    });

    it("should handle create error", async () => {
      mockApiClient.createRecipe.mockRejectedValueOnce(
        new Error("Creation failed"),
      );

      await store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: {
            name: "New Recipe",
            description: "Description",
            steps: ["Step 1"],
          },
        }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Creation failed");
    });

    it("should clear error on pending", async () => {
      // First, set an error
      mockApiClient.createRecipe.mockRejectedValueOnce(new Error("Error"));
      await store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: { name: "Test", description: "Test", steps: [] },
        }),
      );

      expect(store.getState().recipes.error).toBe("Error");

      // Now dispatch another create - error should be cleared on pending
      mockApiClient.createRecipe.mockReturnValueOnce(new Promise(() => {}));
      store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: { name: "Test", description: "Test", steps: [] },
        }),
      );

      expect(store.getState().recipes.error).toBe(null);
    });
  });

  describe("updateRecipe thunk", () => {
    beforeEach(async () => {
      const existingRecipe = createMockRecipe({ name: "Original Name" });
      mockApiClient.getRecipes.mockResolvedValueOnce([existingRecipe]);
      await store.dispatch(fetchRecipes("family-1"));
    });

    it("should update recipe successfully", async () => {
      const updatedRecipe = createMockRecipe({ name: "Updated Name" });

      mockApiClient.updateRecipe.mockResolvedValueOnce(updatedRecipe);

      await store.dispatch(
        updateRecipe({
          familyId: "family-1",
          recipeId: "recipe-1",
          data: { name: "Updated Name" },
        }),
      );

      const state = store.getState().recipes;
      const recipe = state.recipes.find((r) => r._id === "recipe-1");
      expect(recipe?.name).toBe("Updated Name");
    });

    it("should update currentRecipe if it matches", async () => {
      // Set current recipe
      mockApiClient.getRecipe.mockResolvedValueOnce(createMockRecipe());
      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const updatedRecipe = createMockRecipe({ name: "Updated Name" });
      mockApiClient.updateRecipe.mockResolvedValueOnce(updatedRecipe);

      await store.dispatch(
        updateRecipe({
          familyId: "family-1",
          recipeId: "recipe-1",
          data: { name: "Updated Name" },
        }),
      );

      const state = store.getState().recipes;
      expect(state.currentRecipe?.name).toBe("Updated Name");
    });

    it("should handle update error", async () => {
      mockApiClient.updateRecipe.mockRejectedValueOnce(
        new Error("Update failed"),
      );

      await store.dispatch(
        updateRecipe({
          familyId: "family-1",
          recipeId: "recipe-1",
          data: { name: "Updated Name" },
        }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Update failed");
    });

    it("should not update recipe when not found in state", async () => {
      const updatedRecipe = createMockRecipe({
        _id: "nonexistent-recipe",
        name: "Updated",
      });

      mockApiClient.updateRecipe.mockResolvedValueOnce(updatedRecipe);

      await store.dispatch(
        updateRecipe({
          familyId: "family-1",
          recipeId: "nonexistent-recipe",
          data: { name: "Updated" },
        }),
      );

      const state = store.getState().recipes;
      expect(state.recipes).toHaveLength(1);
      expect(state.recipes[0].name).toBe("Original Name");
    });
  });

  describe("deleteRecipe thunk", () => {
    beforeEach(async () => {
      const recipes = [
        createMockRecipe({ _id: "recipe-1" }),
        createMockRecipe({ _id: "recipe-2" }),
      ];
      mockApiClient.getRecipes.mockResolvedValueOnce(recipes);
      await store.dispatch(fetchRecipes("family-1"));
    });

    it("should delete recipe successfully", async () => {
      mockApiClient.deleteRecipe.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.recipes.find((r) => r._id === "recipe-1")).toBeUndefined();
      expect(state.recipes).toHaveLength(1);
    });

    it("should clear currentRecipe if deleted", async () => {
      mockApiClient.getRecipe.mockResolvedValueOnce(
        createMockRecipe({ _id: "recipe-1" }),
      );
      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      mockApiClient.deleteRecipe.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.currentRecipe).toBe(null);
    });

    it("should clear step progress for deleted recipe", async () => {
      // Add some step progress
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
      );
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 1 }),
      );
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-2", stepIndex: 0 }),
      );

      mockApiClient.deleteRecipe.mockResolvedValueOnce(undefined);

      await store.dispatch(
        deleteRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.stepProgress["recipe-1-0"]).toBeUndefined();
      expect(state.stepProgress["recipe-1-1"]).toBeUndefined();
      expect(state.stepProgress["recipe-2-0"]).toBe(true);
    });

    it("should handle delete error", async () => {
      mockApiClient.deleteRecipe.mockRejectedValueOnce(
        new Error("Delete failed"),
      );

      await store.dispatch(
        deleteRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Delete failed");
      expect(state.recipes).toHaveLength(2);
    });
  });

  describe("searchRecipes thunk", () => {
    it("should search recipes successfully", async () => {
      const searchResults = [
        createMockRecipe({ _id: "recipe-1", name: "Pasta" }),
      ];

      mockApiClient.searchRecipes.mockResolvedValueOnce(searchResults);

      await store.dispatch(
        searchRecipes({ familyId: "family-1", query: "pasta" }),
      );

      const state = store.getState().recipes;
      expect(state.searchResults).toEqual(searchResults);
      expect(state.searchQuery).toBe("pasta");
      expect(state.isSearching).toBe(false);
    });

    it("should set isSearching during search", () => {
      mockApiClient.searchRecipes.mockReturnValueOnce(new Promise(() => {}));

      store.dispatch(searchRecipes({ familyId: "family-1", query: "pasta" }));

      const state = store.getState().recipes;
      expect(state.isSearching).toBe(true);
      expect(state.error).toBe(null);
    });

    it("should handle search error", async () => {
      mockApiClient.searchRecipes.mockRejectedValueOnce(
        new Error("Search failed"),
      );

      await store.dispatch(
        searchRecipes({ familyId: "family-1", query: "pasta" }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Search failed");
      expect(state.isSearching).toBe(false);
    });
  });

  describe("reducers", () => {
    describe("clearError", () => {
      it("should clear error", async () => {
        mockApiClient.getRecipes.mockRejectedValueOnce(new Error("Error"));
        await store.dispatch(fetchRecipes("family-1"));

        expect(store.getState().recipes.error).toBe("Error");

        store.dispatch(clearError());

        expect(store.getState().recipes.error).toBe(null);
      });
    });

    describe("setSearchQuery", () => {
      it("should set search query", () => {
        store.dispatch(setSearchQuery("pasta"));

        const state = store.getState().recipes;
        expect(state.searchQuery).toBe("pasta");
      });

      it("should clear search results when query is empty", async () => {
        mockApiClient.searchRecipes.mockResolvedValueOnce([createMockRecipe()]);
        await store.dispatch(
          searchRecipes({ familyId: "family-1", query: "pasta" }),
        );

        store.dispatch(setSearchQuery(""));

        const state = store.getState().recipes;
        expect(state.searchQuery).toBe("");
        expect(state.searchResults).toEqual([]);
      });
    });

    describe("toggleStepComplete", () => {
      it("should toggle step to complete", () => {
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
        );

        const state = store.getState().recipes;
        expect(state.stepProgress["recipe-1-0"]).toBe(true);
      });

      it("should toggle step to incomplete", () => {
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
        );
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
        );

        const state = store.getState().recipes;
        expect(state.stepProgress["recipe-1-0"]).toBe(false);
      });

      it("should handle multiple steps independently", () => {
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
        );
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 2 }),
        );

        const state = store.getState().recipes;
        expect(state.stepProgress["recipe-1-0"]).toBe(true);
        expect(state.stepProgress["recipe-1-1"]).toBeUndefined();
        expect(state.stepProgress["recipe-1-2"]).toBe(true);
      });
    });

    describe("resetStepProgress", () => {
      it("should reset all steps for a recipe", () => {
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
        );
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 1 }),
        );
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-1", stepIndex: 2 }),
        );
        store.dispatch(
          toggleStepComplete({ recipeId: "recipe-2", stepIndex: 0 }),
        );

        store.dispatch(resetStepProgress("recipe-1"));

        const state = store.getState().recipes;
        expect(state.stepProgress["recipe-1-0"]).toBeUndefined();
        expect(state.stepProgress["recipe-1-1"]).toBeUndefined();
        expect(state.stepProgress["recipe-1-2"]).toBeUndefined();
        expect(state.stepProgress["recipe-2-0"]).toBe(true);
      });
    });

    describe("clearCurrentRecipe", () => {
      it("should clear current recipe", async () => {
        mockApiClient.getRecipe.mockResolvedValueOnce(createMockRecipe());
        await store.dispatch(
          fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
        );

        expect(store.getState().recipes.currentRecipe).not.toBe(null);

        store.dispatch(clearCurrentRecipe());

        expect(store.getState().recipes.currentRecipe).toBe(null);
      });
    });
  });

  describe("selectors", () => {
    beforeEach(async () => {
      const mockRecipes = [
        createMockRecipe({ _id: "recipe-1", name: "Recipe 1" }),
        createMockRecipe({ _id: "recipe-2", name: "Recipe 2" }),
      ];

      mockApiClient.getRecipes.mockResolvedValueOnce(mockRecipes);
      await store.dispatch(fetchRecipes("family-1"));
    });

    it("selectRecipes should return all recipes", () => {
      const state = store.getState();
      const recipes = selectRecipes(state);
      expect(recipes).toHaveLength(2);
    });

    it("selectCurrentRecipe should return current recipe", async () => {
      mockApiClient.getRecipe.mockResolvedValueOnce(createMockRecipe());
      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState();
      const currentRecipe = selectCurrentRecipe(state);
      expect(currentRecipe?._id).toBe("recipe-1");
    });

    it("selectRecipesLoading should return loading state", () => {
      const state = store.getState();
      const isLoading = selectRecipesLoading(state);
      expect(typeof isLoading).toBe("boolean");
    });

    it("selectRecipesError should return error state", () => {
      const state = store.getState();
      const error = selectRecipesError(state);
      expect(error).toBe(null);
    });

    it("selectSearchQuery should return search query", () => {
      store.dispatch(setSearchQuery("test"));
      const state = store.getState();
      const query = selectSearchQuery(state);
      expect(query).toBe("test");
    });

    it("selectSearchResults should return search results", async () => {
      mockApiClient.searchRecipes.mockResolvedValueOnce([createMockRecipe()]);
      await store.dispatch(
        searchRecipes({ familyId: "family-1", query: "test" }),
      );

      const state = store.getState();
      const results = selectSearchResults(state);
      expect(results).toHaveLength(1);
    });

    it("selectIsSearching should return searching state", () => {
      const state = store.getState();
      const isSearching = selectIsSearching(state);
      expect(typeof isSearching).toBe("boolean");
    });

    it("selectStepProgress should return step progress", () => {
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
      );
      const state = store.getState();
      const progress = selectStepProgress(state);
      expect(progress["recipe-1-0"]).toBe(true);
    });

    it("selectRecipeById should return specific recipe", () => {
      const state = store.getState();
      const recipe = selectRecipeById("recipe-1")(state);
      expect(recipe?.name).toBe("Recipe 1");
    });

    it("selectRecipeById should return undefined for non-existent recipe", () => {
      const state = store.getState();
      const recipe = selectRecipeById("non-existent")(state);
      expect(recipe).toBeUndefined();
    });

    it("selectStepComplete should return step completion status", () => {
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
      );
      const state = store.getState();

      expect(selectStepComplete("recipe-1", 0)(state)).toBe(true);
      expect(selectStepComplete("recipe-1", 1)(state)).toBe(false);
    });

    it("selectCompletedStepsCount should return count of completed steps", () => {
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 0 }),
      );
      store.dispatch(
        toggleStepComplete({ recipeId: "recipe-1", stepIndex: 2 }),
      );

      const state = store.getState();
      const count = selectCompletedStepsCount("recipe-1", 5)(state);
      expect(count).toBe(2);
    });
  });

  describe("error handling edge cases", () => {
    it("should handle fetchRecipes rejection with default message", async () => {
      mockApiClient.getRecipes.mockRejectedValueOnce({});

      await store.dispatch(fetchRecipes("family-1"));

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to fetch recipes");
    });

    it("should handle fetchRecipe rejection with default message", async () => {
      mockApiClient.getRecipe.mockRejectedValueOnce({});

      await store.dispatch(
        fetchRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to fetch recipe");
    });

    it("should handle createRecipe rejection with default message", async () => {
      mockApiClient.createRecipe.mockRejectedValueOnce({});

      await store.dispatch(
        createRecipe({
          familyId: "family-1",
          data: { name: "Test", description: "Test", steps: [] },
        }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to create recipe");
    });

    it("should handle updateRecipe rejection with default message", async () => {
      mockApiClient.updateRecipe.mockRejectedValueOnce({});

      await store.dispatch(
        updateRecipe({
          familyId: "family-1",
          recipeId: "recipe-1",
          data: { name: "Updated" },
        }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to update recipe");
    });

    it("should handle deleteRecipe rejection with default message", async () => {
      mockApiClient.deleteRecipe.mockRejectedValueOnce({});

      await store.dispatch(
        deleteRecipe({ familyId: "family-1", recipeId: "recipe-1" }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to delete recipe");
    });

    it("should handle searchRecipes rejection with default message", async () => {
      mockApiClient.searchRecipes.mockRejectedValueOnce({});

      await store.dispatch(
        searchRecipes({ familyId: "family-1", query: "test" }),
      );

      const state = store.getState().recipes;
      expect(state.error).toBe("Failed to search recipes");
    });
  });
});
