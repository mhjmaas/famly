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
  if (!reward) return null;

  const copy = dict.dashboard.pages.rewards.delete;

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
