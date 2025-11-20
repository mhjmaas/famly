"use client";

import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { DictionarySection } from "@/i18n/types";

interface ContributionGoalDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
  dict: DictionarySection<"contributionGoals">;
}

export function ContributionGoalDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  dict,
}: ContributionGoalDeleteDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const dialogCopy = dict.dialog;

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent data-testid="delete-goal-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogCopy.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {dialogCopy.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading}
              data-testid="confirm-delete-button"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogCopy.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{dialogCopy.deleteTitle}</DrawerTitle>
          <DrawerDescription>{dialogCopy.deleteDescription}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="gap-2 pt-2">
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
            data-testid="confirm-delete-button"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {dialogCopy.delete}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {dialogCopy.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
