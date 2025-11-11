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
import type { Task } from "@/types/api.types";

interface DeleteTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onDeleteSingle: () => void;
  onDeleteAll: () => void;
  dict: any;
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

  if (!task) return null;

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
