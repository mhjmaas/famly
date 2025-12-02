"use client";

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
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface DeleteShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listName: string;
  onConfirm: () => void;
  translations: {
    title: string;
    description: string;
    cancel: string;
    confirm: string;
  };
}

export function DeleteShoppingListDialog({
  open,
  onOpenChange,
  listName,
  onConfirm,
  translations,
}: DeleteShoppingListDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const header = (
    <>
      <DialogTitle data-testid="shopping-list-delete-title">
        {translations.title}
      </DialogTitle>
      <DialogDescription data-testid="shopping-list-delete-description">
        {translations.description.replace("{name}", listName)}
      </DialogDescription>
    </>
  );

  // Desktop: AlertDialog
  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent data-testid="shopping-list-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="shopping-list-delete-title">
              {translations.title}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="shopping-list-delete-description">
              {translations.description.replace("{name}", listName)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="shopping-list-delete-cancel">
              {translations.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="shopping-list-delete-confirm"
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {translations.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent data-testid="shopping-list-delete-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <DrawerFooter className="gap-3 pt-2">
          <Button
            onClick={onConfirm}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="shopping-list-delete-confirm"
          >
            {translations.confirm}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full"
              data-testid="shopping-list-delete-cancel"
            >
              {translations.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
