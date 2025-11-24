"use client";

import { Loader2 } from "lucide-react";
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
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { DictionarySection } from "@/i18n/types";

export interface ContributionGoalFormState {
  title: string;
  description: string;
  maxKarma: string;
  recurring: boolean;
}

interface ContributionGoalDialogProps {
  open: boolean;
  mode: "create" | "edit";
  memberName: string;
  formState: ContributionGoalFormState;
  onFormChange: (next: ContributionGoalFormState) => void;
  onSubmit: () => void;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  dict: DictionarySection<"contributionGoals">;
}

export function ContributionGoalDialog({
  open,
  mode,
  memberName,
  formState,
  onFormChange,
  onSubmit,
  onOpenChange,
  isSubmitting,
  dict,
}: ContributionGoalDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const dialogCopy = dict.dialog;
  const titleText =
    mode === "edit" ? dialogCopy.editTitle : dialogCopy.createTitle;
  const descriptionText = dialogCopy.description.replace(
    "{memberName}",
    memberName,
  );

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="goal-title">{dialogCopy.titleLabel}</Label>
        <Input
          id="goal-title"
          value={formState.title}
          onChange={(event) =>
            onFormChange({ ...formState, title: event.target.value })
          }
          placeholder={dialogCopy.titlePlaceholder}
          maxLength={200}
          data-testid="goal-title-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal-description">{dialogCopy.descriptionLabel}</Label>
        <Textarea
          id="goal-description"
          value={formState.description}
          onChange={(event) =>
            onFormChange({ ...formState, description: event.target.value })
          }
          placeholder={dialogCopy.descriptionPlaceholder}
          maxLength={2000}
          data-testid="goal-description-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="goal-max-karma">{dialogCopy.maxKarmaLabel}</Label>
        <Input
          id="goal-max-karma"
          type="number"
          value={formState.maxKarma}
          onChange={(event) =>
            onFormChange({ ...formState, maxKarma: event.target.value })
          }
          min={1}
          max={10000}
          data-testid="goal-max-karma-input"
        />
      </div>
      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <div className="space-y-0.5">
          <Label htmlFor="goal-recurring-toggle">
            {dialogCopy.recurringLabel}
          </Label>
          <p className="text-sm text-muted-foreground">
            {dialogCopy.recurringDescription}
          </p>
        </div>
        <Switch
          id="goal-recurring-toggle"
          checked={formState.recurring}
          onCheckedChange={(checked) =>
            onFormChange({ ...formState, recurring: checked })
          }
          data-testid="goal-recurring-toggle"
        />
      </div>
    </div>
  );

  const primaryLabel = mode === "edit" ? dialogCopy.update : dialogCopy.create;

  const footerButtons = (
    <>
      <Button
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isSubmitting}
      >
        {dialogCopy.cancel}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={isSubmitting || !formState.title}
        data-testid="save-goal-button"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {primaryLabel}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-testid="edit-goal-dialog">
          <DialogHeader>
            <DialogTitle>{titleText}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footerButtons}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{titleText}</DrawerTitle>
          <DrawerDescription>{descriptionText}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 overflow-y-auto max-h-[60vh]">{content}</div>
        <DrawerFooter>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !formState.title}
            data-testid="save-goal-button"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {primaryLabel}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {dialogCopy.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
