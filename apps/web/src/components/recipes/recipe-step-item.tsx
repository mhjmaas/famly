"use client";

import { Check, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils/style-utils";

interface RecipeStepItemProps {
  stepIndex: number;
  stepText: string;
  isCompleted: boolean;
  onToggle: () => void;
  onEdit: (newText: string) => void;
  onDelete: () => void;
  dict: Dictionary;
}

export function RecipeStepItem({
  stepIndex,
  stepText,
  isCompleted,
  onToggle,
  onEdit,
  onDelete,
  dict,
}: RecipeStepItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(stepText);
  const t = dict.dashboard.pages.recipes.detail.steps;

  const handleSave = () => {
    if (editText.trim()) {
      onEdit(editText.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditText(stepText);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50"
        data-testid={`recipe-step-${stepIndex}-editing`}
      >
        <span className="text-sm font-medium text-muted-foreground w-6">
          {stepIndex + 1}.
        </span>
        <Input
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          autoFocus
          data-testid={`recipe-step-${stepIndex}-edit-input`}
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSave}
          data-testid={`recipe-step-${stepIndex}-save-button`}
        >
          <Check className="h-4 w-4" />
          <span className="sr-only">{t.edit.save}</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          data-testid={`recipe-step-${stepIndex}-cancel-button`}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t.edit.cancel}</span>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg border transition-colors",
        isCompleted && "bg-muted/50",
      )}
      data-testid={`recipe-step-${stepIndex}`}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        data-testid={`recipe-step-${stepIndex}-checkbox`}
      />
      <span className="text-sm font-medium text-muted-foreground w-6">
        {stepIndex + 1}.
      </span>
      <span
        className={cn(
          "flex-1 text-sm",
          isCompleted && "line-through text-muted-foreground",
        )}
        data-testid={`recipe-step-${stepIndex}-text`}
      >
        {stepText}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => setIsEditing(true)}
          data-testid={`recipe-step-${stepIndex}-edit-button`}
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit step</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
          data-testid={`recipe-step-${stepIndex}-delete-button`}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete step</span>
        </Button>
      </div>
    </div>
  );
}
