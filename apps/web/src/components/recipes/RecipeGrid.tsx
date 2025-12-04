"use client";

import type { Dictionary } from "@/i18n/types";
import type { Recipe } from "@/types/api.types";
import { RecipeCard } from "./RecipeCard";

interface RecipeGridProps {
  recipes: Recipe[];
  locale: string;
  dict: Dictionary;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export function RecipeGrid({
  recipes,
  locale,
  dict,
  onEdit,
  onDelete,
}: RecipeGridProps) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="recipes-grid"
    >
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe._id}
          recipe={recipe}
          locale={locale}
          dict={dict}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
