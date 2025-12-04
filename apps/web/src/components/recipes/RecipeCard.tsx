"use client";

import { ArrowRight, Clock, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dictionary } from "@/i18n/types";
import type { Recipe } from "@/types/api.types";

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
      className="group cursor-pointer transition-shadow hover:shadow-md"
      data-testid={`recipe-card-${recipe._id}`}
      onClick={handleViewDetails}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle
              className="text-lg truncate"
              data-testid={`recipe-card-title-${recipe._id}`}
            >
              {recipe.name}
            </CardTitle>
            <CardDescription
              className="line-clamp-2 mt-1"
              data-testid={`recipe-card-description-${recipe._id}`}
            >
              {recipe.description || t.card.noDescription}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                data-testid={`recipe-card-menu-${recipe._id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                onClick={() => onEdit(recipe)}
                data-testid={`recipe-card-edit-${recipe._id}`}
              >
                {t.menu.edit}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(recipe)}
                className="text-destructive"
                data-testid={`recipe-card-delete-${recipe._id}`}
              >
                {t.menu.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {recipe.durationMinutes && (
            <Badge
              variant="secondary"
              className="flex items-center gap-1"
              data-testid={`recipe-card-duration-${recipe._id}`}
            >
              <Clock className="h-3 w-3" />
              {t.card.duration.replace(
                "{minutes}",
                recipe.durationMinutes.toString(),
              )}
            </Badge>
          )}
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
