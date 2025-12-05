"use client";

import { ArrowLeft, Calendar, Clock, Pencil, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Dictionary } from "@/i18n/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCurrentRecipe,
  deleteRecipe,
  fetchRecipe,
  selectCurrentRecipe,
  selectRecipesError,
  selectRecipesLoading,
  updateRecipe,
} from "@/store/slices/recipes.slice";
import type { UpdateRecipeRequest } from "@/types/api.types";
import { EditRecipeDialog } from "./edit-recipe-dialog";
import { RecipeImage } from "./recipe-image";
import { RecipeStepList } from "./recipe-step-list";

interface RecipeDetailViewProps {
  recipeId: string;
  familyId: string;
  locale: string;
  dict: Dictionary;
  familyMembers: Array<{ id: string; name: string }>;
}

export function RecipeDetailView({
  recipeId,
  familyId,
  locale,
  dict,
  familyMembers,
}: RecipeDetailViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const recipe = useAppSelector(selectCurrentRecipe);
  const isLoading = useAppSelector(selectRecipesLoading);
  const error = useAppSelector(selectRecipesError);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const t = dict.dashboard.pages.recipes;

  useEffect(() => {
    if (familyId && recipeId) {
      dispatch(fetchRecipe({ familyId, recipeId }));
    }

    return () => {
      dispatch(clearCurrentRecipe());
    };
  }, [dispatch, familyId, recipeId]);

  const handleUpdateRecipe = async (data: UpdateRecipeRequest) => {
    await dispatch(
      updateRecipe({
        familyId,
        recipeId,
        data,
      }),
    ).unwrap();
    toast.success(t.edit.success);
    setIsEditOpen(false);
  };

  const handleDeleteRecipe = async () => {
    try {
      await dispatch(deleteRecipe({ familyId, recipeId })).unwrap();
      toast.success(t.delete.success);
      router.push(`/${locale}/app/recipes`);
    } catch {
      toast.error(t.delete.error);
    }
  };

  const getCreatorName = (createdBy: string) => {
    const member = familyMembers.find((m) => m.id === createdBy);
    return member?.name || "Unknown";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading && !recipe) {
    return (
      <div className="text-center py-12" data-testid="recipe-detail-loading">
        {t.loading}
      </div>
    );
  }

  if (error && !recipe) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center"
        data-testid="recipe-detail-not-found"
      >
        <h2 className="text-xl font-semibold">{t.detail.notFound.title}</h2>
        <p className="text-muted-foreground mt-2">
          {t.detail.notFound.description}
        </p>
        <Button asChild className="mt-4">
          <Link href={`/${locale}/app/recipes`}>{t.detail.notFound.cta}</Link>
        </Button>
      </div>
    );
  }

  if (!recipe) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="recipe-detail-page">
      {/* Back Button - Mobile only */}
      <div className="-mx-4 mb-4 lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2"
          data-testid="recipe-detail-back-button"
        >
          <Link href={`/${locale}/app/recipes`}>
            <ArrowLeft className="h-4 w-4" />
            {t.detail.backToRecipes}
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-2xl font-bold text-foreground"
            data-testid="recipe-detail-title"
          >
            {recipe.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            data-testid="recipe-detail-edit-button"
          >
            <Pencil className="h-4 w-4 mr-2" />
            {t.menu.edit}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteRecipe}
            data-testid="recipe-detail-delete-button"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t.menu.delete}
          </Button>
        </div>
      </div>

      {/* Breadcrumbs - Desktop */}
      <div className="hidden lg:block" data-testid="breadcrumb-navigation">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/${locale}/app/recipes`}
                  data-testid="breadcrumb-recipes"
                >
                  {t.detail.breadcrumbs.recipes}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-current-recipe">
                {recipe.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Recipe metadata card */}
      <Card data-testid="recipe-detail-card" className="overflow-hidden">
        {/* Recipe Image */}
        {recipe.imageUrl && (
          <div
            className="relative aspect-video w-full overflow-hidden bg-muted"
            data-testid="recipe-detail-image-container"
          >
            <RecipeImage imageUrl={recipe.imageUrl} name={recipe.name} />
          </div>
        )}
        <CardHeader>
          <CardTitle>{recipe.name}</CardTitle>
          <CardDescription data-testid="recipe-detail-description">
            {recipe.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {recipe.durationMinutes && (
              <div
                className="flex items-center gap-1"
                data-testid="recipe-detail-duration"
              >
                <Clock className="h-4 w-4" />
                {t.detail.duration.replace(
                  "{minutes}",
                  recipe.durationMinutes.toString(),
                )}
              </div>
            )}
            <div
              className="flex items-center gap-1"
              data-testid="recipe-detail-created-by"
            >
              <User className="h-4 w-4" />
              {t.detail.addedBy.replace(
                "{name}",
                getCreatorName(recipe.createdBy),
              )}
            </div>
            <div
              className="flex items-center gap-1"
              data-testid="recipe-detail-created-at"
            >
              <Calendar className="h-4 w-4" />
              {t.detail.createdAt.replace(
                "{date}",
                formatDate(recipe.createdAt),
              )}
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              data-testid="recipe-detail-tags"
            >
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Steps section */}
      <RecipeStepList recipe={recipe} familyId={familyId} dict={dict} />

      {/* Edit dialog */}
      {recipe && (
        <EditRecipeDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleUpdateRecipe}
          recipe={recipe}
          dict={dict}
        />
      )}
    </div>
  );
}
