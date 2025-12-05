"use client";

import { Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { Dictionary } from "@/i18n/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createRecipe,
  deleteRecipe,
  fetchRecipes,
  searchRecipes,
  selectIsSearching,
  selectRecipes,
  selectRecipesError,
  selectRecipesLoading,
  selectSearchQuery,
  selectSearchResults,
  setSearchQuery,
  updateRecipe,
} from "@/store/slices/recipes.slice";
import type { CreateRecipeRequest, Recipe } from "@/types/api.types";
import { CreateRecipeDialog } from "./create-recipe-dialog";
import { RecipeEmptyState } from "./recipe-empty-state";
import { RecipeGrid } from "./recipe-grid";
import { RecipeSearch } from "./recipe-search";

interface RecipesViewProps {
  dict: Dictionary;
  familyId: string;
  locale: string;
}

export function RecipesView({ dict, familyId, locale }: RecipesViewProps) {
  const dispatch = useAppDispatch();
  const recipes = useAppSelector(selectRecipes);
  const searchResults = useAppSelector(selectSearchResults);
  const searchQuery = useAppSelector(selectSearchQuery);
  const isSearching = useAppSelector(selectIsSearching);
  const isLoading = useAppSelector(selectRecipesLoading);
  const error = useAppSelector(selectRecipesError);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const t = dict.dashboard.pages.recipes;

  // Fetch recipes on mount
  useEffect(() => {
    if (familyId) {
      dispatch(fetchRecipes(familyId));
    }
  }, [dispatch, familyId]);

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        dispatch(searchRecipes({ familyId, query }));
      } else {
        dispatch(setSearchQuery(""));
      }
    },
    [dispatch, familyId],
  );

  const handleClearSearch = useCallback(() => {
    dispatch(setSearchQuery(""));
  }, [dispatch]);

  const handleCreateRecipe = async (
    data: CreateRecipeRequest,
    imageFile?: File,
  ) => {
    await dispatch(createRecipe({ familyId, data, imageFile })).unwrap();
    toast.success(t.create.success);
  };

  const handleUpdateRecipe = async (
    data: CreateRecipeRequest,
    imageFile?: File,
  ) => {
    if (!editingRecipe) return;
    await dispatch(
      updateRecipe({
        familyId,
        recipeId: editingRecipe._id,
        data,
        imageFile,
      }),
    ).unwrap();
    toast.success(t.edit.success);
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    try {
      await dispatch(deleteRecipe({ familyId, recipeId: recipe._id })).unwrap();
      toast.success(t.delete.success);
    } catch {
      toast.error(t.delete.error);
    }
  };

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setIsCreateOpen(true);
  };

  const handleRefresh = async () => {
    if (familyId) {
      await dispatch(fetchRecipes(familyId));
    }
  };

  const displayedRecipes = searchQuery ? searchResults : recipes;
  const hasRecipes = displayedRecipes.length > 0;
  const showEmptyState = !isLoading && !hasRecipes;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6" data-testid="recipes-page">
        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          data-testid="recipes-header"
        >
          <div>
            <h1
              className="hidden sm:block text-3xl font-bold"
              data-testid="recipes-title"
            >
              {t.title}
            </h1>
            <p
              className="text-muted-foreground text-center sm:text-left"
              data-testid="recipes-description"
            >
              {t.description}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="hidden sm:flex gap-2"
            data-testid="recipes-create-button"
          >
            <Plus className="h-4 w-4" />
            {t.newRecipe}
          </Button>
        </div>

        <RecipeSearch
          searchQuery={searchQuery}
          onSearch={handleSearch}
          onClear={handleClearSearch}
          resultsCount={searchResults.length}
          isSearching={isSearching}
          dict={dict}
        />

        {isLoading && recipes.length === 0 && (
          <div className="text-center py-12" data-testid="recipes-loading">
            {t.loading}
          </div>
        )}

        {error && (
          <div
            className="text-center py-12 text-destructive"
            data-testid="recipes-error"
          >
            {error}
          </div>
        )}

        {showEmptyState && (
          <RecipeEmptyState
            isSearchResult={!!searchQuery}
            onCreateRecipe={() => setIsCreateOpen(true)}
            dict={dict}
          />
        )}

        {hasRecipes && (
          <RecipeGrid
            recipes={displayedRecipes}
            locale={locale}
            dict={dict}
            onEdit={handleEditRecipe}
            onDelete={handleDeleteRecipe}
          />
        )}

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:hidden gap-2"
          data-testid="recipes-create-button-mobile"
        >
          <Plus className="h-4 w-4" />
          {t.newRecipe}
        </Button>

        <CreateRecipeDialog
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingRecipe(null);
          }}
          onSubmit={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
          editingRecipe={editingRecipe}
          dict={dict}
        />
      </div>
    </PullToRefresh>
  );
}
