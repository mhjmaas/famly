"use client";

import { toast } from "sonner";
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
import type { FamilyMember } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeFamilyMember,
  selectFamilyMembers,
  selectOperationError,
  selectOperationLoading,
} from "@/store/slices/family.slice";

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: {
    removeDialog: {
      title: string;
      description: string;
      warning: string;
      lastParentError: string;
      cancel: string;
      confirm: string;
      success: string;
    };
    errors: {
      removeFailed: string;
    };
  };
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  member,
  familyId,
  dict,
}: RemoveMemberDialogProps) {
  const dispatch = useAppDispatch();
  const members = useAppSelector(selectFamilyMembers);
  const isLoading = useAppSelector(selectOperationLoading("removeMember"));
  const error = useAppSelector(selectOperationError("removeMember"));

  const isLastParent = () => {
    if (!member || member.role !== "Parent") return false;
    const parentCount = members.filter((m) => m.role === "Parent").length;
    return parentCount === 1;
  };

  const handleConfirm = async () => {
    if (!member) return;

    if (isLastParent()) {
      toast.error(dict.removeDialog.lastParentError);
      return;
    }

    try {
      await dispatch(
        removeFamilyMember({
          familyId,
          memberId: member.memberId,
        }),
      ).unwrap();

      toast.success(dict.removeDialog.success);
      onClose();
    } catch (_err) {
      toast.error(dict.errors.removeFailed, {
        description: error || undefined,
      });
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dict.removeDialog.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {dict.removeDialog.description.replace(
              "{name}",
              member?.name || "",
            )}
            <br />
            <br />
            {dict.removeDialog.warning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {dict.removeDialog.cancel}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {dict.removeDialog.confirm}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
