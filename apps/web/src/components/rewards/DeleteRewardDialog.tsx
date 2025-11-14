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
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Dictionary } from "@/i18n/types";
import type { Reward } from "@/types/api.types";

interface DeleteRewardDialogProps {
  isOpen: boolean;
  reward: Reward | null;
  onClose: () => void;
  onConfirm: () => void;
  dict: Dictionary;
}

export function DeleteRewardDialog({
  isOpen,
  reward,
  onClose,
  onConfirm,
  dict,
}: DeleteRewardDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (!reward) return null;

  const copy = dict.dashboard.pages.rewards.delete;

  const header = (
    <>
      <DialogTitle data-testid="reward-delete-title">{copy.title}</DialogTitle>
      <DialogDescription data-testid="reward-delete-description">
        {copy.description.replace("{name}", reward.name)}
      </DialogDescription>
    </>
  );

  // Desktop: AlertDialog
  if (isDesktop) {
    return (
      <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AlertDialogContent data-testid="reward-delete-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="reward-delete-title">
              {copy.title}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="reward-delete-description">
              {copy.description.replace("{name}", reward.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="reward-delete-cancel">
              {copy.buttons.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="reward-delete-confirm"
            >
              {copy.buttons.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent data-testid="reward-delete-dialog">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <DrawerFooter className="gap-2 pt-2">
          <Button
            onClick={onConfirm}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="reward-delete-confirm"
          >
            {copy.buttons.confirm}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="w-full"
              data-testid="reward-delete-cancel"
            >
              {copy.buttons.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
