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
import type { Dictionary } from "@/i18n/types";
import type { Task } from "@/types/api.types";

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
  dict: Dictionary;
}

export function DeleteTaskDialog({
  isOpen,
  onClose,
  task,
  onDeleteSingle,
  onDeleteAll,
  dict,
}: DeleteTaskDialogProps) {
  const t = dict.dashboard.pages.tasks;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!task) return null;

  const header = (
    <>
      <DialogTitle data-testid="task-delete-title">
        {t.delete.recurringTitle}
      </DialogTitle>
      <DialogDescription data-testid="task-delete-description">
        {t.delete.recurringDescription}
      </DialogDescription>
    </>
  );

  // Desktop: AlertDialog
  if (isDesktop) {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent data-testid="task-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="task-delete-title">
              {t.delete.recurringTitle}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="task-delete-description">
              {t.delete.recurringDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 sm:flex-col sm:gap-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <AlertDialogCancel data-testid="task-delete-cancel">
                {t.delete.buttons.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={onDeleteSingle}
                data-testid="task-delete-one"
              >
                {t.delete.buttons.deleteOne}
              </AlertDialogAction>
            </div>

            <div className="flex w-full flex-col gap-2 border-t border-border pt-4">
              <AlertDialogAction
                onClick={onDeleteAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="task-delete-all"
              >
                {t.delete.buttons.deleteAll}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      repositionInputs={false}
    >
      <DrawerContent data-testid="task-delete-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <DrawerFooter className="gap-3 pt-2">
          <Button
            onClick={onDeleteSingle}
            className="w-full"
            data-testid="task-delete-one"
          >
            {t.delete.buttons.deleteOne}
          </Button>
          <Button
            onClick={onDeleteAll}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="task-delete-all"
          >
            {t.delete.buttons.deleteAll}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full"
              data-testid="task-delete-cancel"
            >
              {t.delete.buttons.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
