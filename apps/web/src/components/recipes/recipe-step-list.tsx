"use client";

import { PartyPopper, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  resetStepProgress,
  selectCompletedStepsCount,
  selectStepComplete,
  toggleStepComplete,
  updateRecipe,
} from "@/store/slices/recipes.slice";
import type { Recipe } from "@/types/api.types";
import { AddStepForm } from "./add-step-form";
import { RecipeStepItem } from "./recipe-step-item";

interface RecipeStepListProps {
  recipe: Recipe;
  familyId: string;
  dict: Dictionary;
}

export function RecipeStepList({
  recipe,
  familyId,
  dict,
}: RecipeStepListProps) {
  const dispatch = useAppDispatch();
  const t = dict.dashboard.pages.recipes.detail.steps;
  const totalSteps = recipe.steps.length;
  const completedCount = useAppSelector(
    selectCompletedStepsCount(recipe._id, totalSteps),
  );
  const allCompleted = totalSteps > 0 && completedCount === totalSteps;

  const handleToggleStep = (stepIndex: number) => {
    dispatch(toggleStepComplete({ recipeId: recipe._id, stepIndex }));
  };

  const handleResetAll = () => {
    dispatch(resetStepProgress(recipe._id));
    toast.success(t.resetSuccess);
  };

  const handleEditStep = async (stepIndex: number, newText: string) => {
    const newSteps = [...recipe.steps];
    newSteps[stepIndex] = newText;
    await dispatch(
      updateRecipe({
        familyId,
        recipeId: recipe._id,
        data: { steps: newSteps },
      }),
    );
  };

  const handleDeleteStep = async (stepIndex: number) => {
    const newSteps = recipe.steps.filter((_, i) => i !== stepIndex);
    await dispatch(
      updateRecipe({
        familyId,
        recipeId: recipe._id,
        data: { steps: newSteps },
      }),
    );
  };

  const handleAddStep = async (stepText: string) => {
    const newSteps = [...recipe.steps, stepText];
    await dispatch(
      updateRecipe({
        familyId,
        recipeId: recipe._id,
        data: { steps: newSteps },
      }),
    );
  };

  return (
    <div className="space-y-4" data-testid="recipe-steps">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold" data-testid="recipe-steps-title">
          {t.title}
        </h2>
        {totalSteps > 0 && (
          <div className="flex items-center gap-4">
            <span
              className="text-sm text-muted-foreground"
              data-testid="recipe-steps-progress"
            >
              {t.progress
                .replace("{completed}", completedCount.toString())
                .replace("{total}", totalSteps.toString())}
            </span>
            {completedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAll}
                data-testid="recipe-steps-reset-button"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t.resetAll}
              </Button>
            )}
          </div>
        )}
      </div>

      {allCompleted && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
          data-testid="recipe-steps-celebration"
        >
          <PartyPopper className="h-5 w-5" />
          <span className="font-medium">{t.celebration}</span>
        </div>
      )}

      {totalSteps === 0 ? (
        <p
          className="text-muted-foreground text-center py-8"
          data-testid="recipe-steps-empty"
        >
          {t.empty}
        </p>
      ) : (
        <div className="space-y-2" data-testid="recipe-steps-list">
          {recipe.steps.map((step, index) => (
            <StepItemWrapper
              key={`${recipe._id}-${index}`}
              recipeId={recipe._id}
              stepIndex={index}
              stepText={step}
              onToggle={() => handleToggleStep(index)}
              onEdit={(newText) => handleEditStep(index, newText)}
              onDelete={() => handleDeleteStep(index)}
              dict={dict}
            />
          ))}
        </div>
      )}

      <AddStepForm onAdd={handleAddStep} dict={dict} />
    </div>
  );
}

// Wrapper to use selector for individual step completion
function StepItemWrapper({
  recipeId,
  stepIndex,
  stepText,
  onToggle,
  onEdit,
  onDelete,
  dict,
}: {
  recipeId: string;
  stepIndex: number;
  stepText: string;
  onToggle: () => void;
  onEdit: (newText: string) => void;
  onDelete: () => void;
  dict: Dictionary;
}) {
  const isCompleted = useAppSelector(selectStepComplete(recipeId, stepIndex));

  return (
    <RecipeStepItem
      stepIndex={stepIndex}
      stepText={stepText}
      isCompleted={isCompleted}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
      dict={dict}
    />
  );
}
