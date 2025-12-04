"use client";

import { ChefHat, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/types";

interface RecipeEmptyStateProps {
  isSearchResult?: boolean;
  onCreateRecipe: () => void;
  dict: Dictionary;
}

export function RecipeEmptyState({
  isSearchResult = false,
  onCreateRecipe,
  dict,
}: RecipeEmptyStateProps) {
  const t = dict.dashboard.pages.recipes;

  if (isSearchResult) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="recipes-empty-search"
      >
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">{t.search.noResults}</h3>
        <p className="text-muted-foreground mt-1">{t.search.noResultsHint}</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="recipes-empty-state"
    >
      <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">{t.emptyState.title}</h3>
      <p className="text-muted-foreground mt-1 mb-4">
        {t.emptyState.description}
      </p>
      <Button
        onClick={onCreateRecipe}
        data-testid="recipes-empty-create-button"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t.emptyState.cta}
      </Button>
    </div>
  );
}
