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
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ShoppingList } from "@/types/api.types";

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingList: ShoppingList | null;
  onSubmit: (data: { name: string; tags: string[] }) => void;
  translations: {
    createTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    tagsLabel: string;
    tagsPlaceholder: string;
    addTags: string;
    cancel: string;
    create: string;
    update: string;
  };
}

export function ShoppingListDialog({
  open,
  onOpenChange,
  editingList,
  onSubmit,
  translations,
}: ShoppingListDialogProps) {
  const [name, setName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTags, setShowTags] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const isEditing = !!editingList;

  useEffect(() => {
    if (open) {
      if (editingList) {
        setName(editingList.name);
        setTags(editingList.tags || []);
        setShowTags((editingList.tags?.length ?? 0) > 0);
      } else {
        setName("");
        setTags([]);
        setTagInput("");
        setShowTags(false);
      }
    }
  }, [open, editingList]);

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

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), tags });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Shared form content
  const FormContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{translations.nameLabel}</Label>
        <Input
          id="name"
          data-testid="shopping-list-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={translations.namePlaceholder}
        />
      </div>

      {!showTags ? (
        <Button
          type="button"
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setShowTags(true)}
          data-testid="shopping-list-add-tags-button"
        >
          <Plus className="h-4 w-4" />
          {translations.addTags}
        </Button>
      ) : (
        <div className="space-y-2">
          <Label>{translations.tagsLabel}</Label>
          <div className="flex gap-2">
            <Input
              data-testid="shopping-list-tags-input"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={translations.tagsPlaceholder}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
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
                  data-testid="shopping-list-tag-badge"
                  className="gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    data-testid="shopping-list-tag-remove"
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const header = (
    <>
      <DialogTitle data-testid="shopping-list-dialog-title">
        {isEditing ? translations.editTitle : translations.createTitle}
      </DialogTitle>
      <DialogDescription className="sr-only">
        {isEditing ? "Edit your shopping list" : "Create a new shopping list"}
      </DialogDescription>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[500px]"
          data-testid="shopping-list-dialog"
        >
          <DialogHeader>{header}</DialogHeader>
          <div className="py-4">{FormContent}</div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="shopping-list-dialog-cancel"
            >
              {translations.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!name.trim()}
              data-testid="shopping-list-dialog-submit"
            >
              {isEditing ? translations.update : translations.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent data-testid="shopping-list-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          {FormContent}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            data-testid="shopping-list-dialog-submit"
          >
            {isEditing ? translations.update : translations.create}
          </Button>
          <DrawerClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="shopping-list-dialog-cancel"
            >
              {translations.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
