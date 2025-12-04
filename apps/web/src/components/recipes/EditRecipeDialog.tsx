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
import type { Recipe, UpdateRecipeRequest } from "@/types/api.types";

interface EditRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateRecipeRequest) => Promise<void>;
  recipe: Recipe;
  dict: Dictionary;
}

export function EditRecipeDialog({
  isOpen,
  onClose,
  onSubmit,
  recipe,
  dict,
}: EditRecipeDialogProps) {
  const t = dict.dashboard.pages.recipes;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [name, setName] = useState(recipe.name);
  const [description, setDescription] = useState(recipe.description);
  const [durationMinutes, setDurationMinutes] = useState(
    recipe.durationMinutes?.toString() || "",
  );
  const [tags, setTags] = useState<string[]>(recipe.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [showTags, setShowTags] = useState((recipe.tags?.length ?? 0) > 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens or recipe changes
  useEffect(() => {
    if (isOpen) {
      setName(recipe.name);
      setDescription(recipe.description);
      setDurationMinutes(recipe.durationMinutes?.toString() || "");
      setTags(recipe.tags || []);
      setShowTags((recipe.tags?.length ?? 0) > 0);
      setTagInput("");
      setError(null);
    }
  }, [isOpen, recipe]);

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
      const data: UpdateRecipeRequest = {
        name: name.trim(),
        description: description.trim(),
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        tags,
      };

      await onSubmit(data);
      handleOpenChange(false);
    } catch {
      setError(t.edit.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Shared form content
  const FormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-recipe-name">{t.create.fields.name.label}</Label>
        <Input
          id="edit-recipe-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.create.fields.name.placeholder}
          data-testid="edit-recipe-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-recipe-description">
          {t.create.fields.description.label}
        </Label>
        <Textarea
          id="edit-recipe-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.create.fields.description.placeholder}
          rows={3}
          data-testid="edit-recipe-description-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-recipe-duration">
          {t.create.fields.duration.label}
        </Label>
        <Input
          id="edit-recipe-duration"
          type="number"
          min="1"
          max="1440"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder={t.create.fields.duration.placeholder}
          data-testid="edit-recipe-duration-input"
        />
      </div>

      {!showTags ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowTags(true)}
          data-testid="edit-recipe-add-tags-button"
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
              data-testid="edit-recipe-tags-input"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
              data-testid="edit-recipe-add-tag-button"
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
                  data-testid="edit-recipe-tag-badge"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                    data-testid="edit-recipe-tag-remove"
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
        <p className="text-sm text-destructive" data-testid="edit-recipe-error">
          {error}
        </p>
      )}
    </div>
  );

  const header = (
    <>
      <DialogTitle data-testid="edit-recipe-dialog-title">
        {t.edit.title}
      </DialogTitle>
      <DialogDescription>{t.edit.description}</DialogDescription>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[500px]"
          data-testid="edit-recipe-dialog"
        >
          <form onSubmit={handleSubmit}>
            <DialogHeader>{header}</DialogHeader>
            <div className="py-4">{FormContent}</div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                data-testid="edit-recipe-cancel-button"
              >
                {t.edit.buttons.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                data-testid="edit-recipe-submit-button"
              >
                {isSubmitting ? t.edit.buttons.updating : t.edit.buttons.update}
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
      <DrawerContent data-testid="edit-recipe-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          {FormContent}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isSubmitting || !name.trim()}
            data-testid="edit-recipe-submit-button"
          >
            {isSubmitting ? t.edit.buttons.updating : t.edit.buttons.update}
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              data-testid="edit-recipe-cancel-button"
            >
              {t.edit.buttons.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
