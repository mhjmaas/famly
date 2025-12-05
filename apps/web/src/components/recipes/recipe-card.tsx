"use client";

import { ArrowRight, Clock, Edit, MoreVertical, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/i18n/types";
import type { Recipe } from "@/types/api.types";
import { RecipeImage } from "./recipe-image";

interface RecipeCardProps {
  recipe: Recipe;
  locale: string;
  dict: Dictionary;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export function RecipeCard({
  recipe,
  locale,
  dict,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const router = useRouter();
  const t = dict.dashboard.pages.recipes;

  const handleViewDetails = () => {
    router.push(`/${locale}/app/recipes/${recipe._id}`);
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-shadow flex flex-col p-0 gap-0"
      data-testid={`recipe-card-${recipe._id}`}
      onClick={handleViewDetails}
    >
      {/* Recipe Image with overlaid menu button */}
      <div
        className="relative aspect-video w-full overflow-hidden bg-muted rounded-t-xl"
        data-testid={`recipe-card-image-container-${recipe._id}`}
      >
        <RecipeImage imageUrl={recipe.imageUrl} name={recipe.name} />
        {/* Menu button overlaid on image */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-background/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`recipe-card-menu-${recipe._id}`}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onEdit(recipe)}
                className="gap-2"
                data-testid={`recipe-card-edit-${recipe._id}`}
              >
                <Edit className="h-4 w-4" />
                {t.menu.edit}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(recipe)}
                className="gap-2 text-destructive"
                data-testid={`recipe-card-delete-${recipe._id}`}
              >
                <Trash2 className="h-4 w-4" />
                {t.menu.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Duration badge overlaid on image */}
        {recipe.durationMinutes && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-background/90 backdrop-blur"
              data-testid={`recipe-card-duration-${recipe._id}`}
            >
              <Clock className="h-3 w-3" />
              {t.card.duration.replace(
                "{minutes}",
                recipe.durationMinutes.toString(),
              )}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <h3
          className="font-semibold text-lg truncate"
          data-testid={`recipe-card-title-${recipe._id}`}
        >
          {recipe.name}
        </h3>
        <p
          className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1"
          data-testid={`recipe-card-description-${recipe._id}`}
        >
          {recipe.description || t.card.noDescription}
        </p>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                data-testid={`recipe-card-tag-${recipe._id}-${tag}`}
              >
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="outline">+{recipe.tags.length - 3}</Badge>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
            onClick={(e) => e.stopPropagation()}
            data-testid={`recipe-card-view-details-${recipe._id}`}
          >
            <Link href={`/${locale}/app/recipes/${recipe._id}`}>
              {t.card.viewDetails}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
