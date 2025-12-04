"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Dictionary } from "@/i18n/types";
import type { CreateRecipeRequest, Recipe } from "@/types/api.types";

interface CreateRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecipeRequest) => Promise<void>;
  editingRecipe?: Recipe | null;
  dict: Dictionary;
}

export function CreateRecipeDialog({
  isOpen,
  onClose,
  onSubmit,
  editingRecipe,
  dict,
}: CreateRecipeDialogProps) {
  const t = dict.dashboard.pages.recipes;
  const isEditing = !!editingRecipe;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or editingRecipe changes
  useEffect(() => {
    if (isOpen) {
      if (editingRecipe) {
        setName(editingRecipe.name);
        setDescription(editingRecipe.description);
        setDurationMinutes(editingRecipe.durationMinutes?.toString() || "");
        setTags(editingRecipe.tags || []);
        setShowTags((editingRecipe.tags?.length ?? 0) > 0);
      } else {
        setName("");
        setDescription("");
        setDurationMinutes("");
        setTags([]);
        setTagInput("");
        setShowTags(false);
      }
      setError(null);
    }
  }, [isOpen, editingRecipe]);

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t.create.fields.name.required);
      return;
    }

    setIsSubmitting(true);

    try {
      const data: CreateRecipeRequest = {
        name: name.trim(),
        description: description.trim(),
        durationMinutes: durationMinutes
          ? parseInt(durationMinutes, 10)
          : undefined,
        steps: editingRecipe?.steps || [],
        tags,
      };

      await onSubmit(data);
      handleOpenChange(false);
    } catch {
      setError(isEditing ? t.edit.error : t.create.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dialogT = isEditing ? t.edit : t.create;

  // Shared form content
  const FormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipe-name">{t.create.fields.name.label}</Label>
        <Input
          id="recipe-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.create.fields.name.placeholder}
          data-testid="create-recipe-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recipe-description">
          {t.create.fields.description.label}
        </Label>
        <Textarea
          id="recipe-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.create.fields.description.placeholder}
          rows={3}
          data-testid="create-recipe-description-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="recipe-duration">
          {t.create.fields.duration.label}
        </Label>
        <Input
          id="recipe-duration"
          type="number"
          min="1"
          max="1440"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder={t.create.fields.duration.placeholder}
          data-testid="create-recipe-duration-input"
        />
      </div>

      {!showTags ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowTags(true)}
          data-testid="create-recipe-add-tags-button"
        >
          <Plus className="h-4 w-4" />
          {t.create.fields.tags.addTags}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label>{t.create.fields.tags.label}</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={t.create.fields.tags.placeholder}
              data-testid="create-recipe-tags-input"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              data-testid="create-recipe-add-tag-button"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1"
                  data-testid="create-recipe-tag-badge"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    data-testid="create-recipe-tag-remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p
          className="text-sm text-destructive"
          data-testid="create-recipe-error"
        >
          {error}
        </p>
      )}
    </div>
  );

  const header = (
    <>
      <DialogTitle data-testid="create-recipe-dialog-title">
        {dialogT.title}
      </DialogTitle>
      <DialogDescription>{dialogT.description}</DialogDescription>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[500px]"
          data-testid="create-recipe-dialog"
        >
          <form onSubmit={handleSubmit}>
            <DialogHeader>{header}</DialogHeader>
            <div className="py-4">{FormContent}</div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="create-recipe-cancel-button"
              >
                {dialogT.buttons.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                data-testid="create-recipe-submit-button"
              >
                {isSubmitting
                  ? isEditing
                    ? t.edit.buttons.updating
                    : t.create.buttons.creating
                  : isEditing
                    ? t.edit.buttons.update
                    : t.create.buttons.create}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer
      open={isOpen}
      onOpenChange={handleOpenChange}
      repositionInputs={false}
    >
      <DrawerContent data-testid="create-recipe-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          {FormContent}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !name.trim()}
            data-testid="create-recipe-submit-button"
          >
            {isSubmitting
              ? isEditing
                ? t.edit.buttons.updating
                : t.create.buttons.creating
              : isEditing
                ? t.edit.buttons.update
                : t.create.buttons.create}
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-testid="create-recipe-cancel-button"
            >
              {dialogT.buttons.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
