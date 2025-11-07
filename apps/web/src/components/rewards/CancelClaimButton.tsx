import { XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CancelClaimButtonProps {
  copy: {
    label: string;
    title: string;
    description: string;
    confirm: string;
    dismiss: string;
  };
  onConfirm: () => Promise<void> | void;
}

export function CancelClaimButton({ copy, onConfirm }: CancelClaimButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          data-testid="reward-cancel-claim-button"
        >
          <XCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{copy.label}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent data-testid="reward-cancel-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="reward-cancel-dialog-dismiss">
            {copy.dismiss}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="reward-cancel-dialog-confirm"
            onClick={onConfirm}
          >
            {copy.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
