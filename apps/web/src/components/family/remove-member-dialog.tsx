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
  const isDesktop = useMediaQuery("(min-width: 768px)");

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

  const header = (
    <>
      <DialogTitle>{dict.removeDialog.title}</DialogTitle>
      <DialogDescription>
        {dict.removeDialog.description.replace("{name}", member?.name || "")}
        <br />
        <br />
        {dict.removeDialog.warning}
      </DialogDescription>
    </>
  );

  // Desktop: AlertDialog
  if (isDesktop) {
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

  // Mobile: Drawer
  return (
    <Drawer open={isOpen} onOpenChange={onClose} repositionInputs={false}>
      <DrawerContent>
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <DrawerFooter className="gap-2 pt-2">
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {dict.removeDialog.confirm}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" disabled={isLoading} className="w-full">
              {dict.removeDialog.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
