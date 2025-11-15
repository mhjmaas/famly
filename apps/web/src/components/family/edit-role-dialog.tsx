"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { FamilyMember } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectOperationError,
  selectOperationLoading,
  updateMemberRole,
} from "@/store/slices/family.slice";

interface EditRoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: FamilyMember | null;
  familyId: string;
  dict: {
    editRoleDialog: {
      title: string;
      description: string;
      currentRole: string;
      newRole: string;
      cancel: string;
      save: string;
      success: string;
    };
    memberCard: {
      roleParent: string;
      roleChild: string;
    };
    errors: {
      updateRoleFailed: string;
    };
  };
}

export function EditRoleDialog({
  isOpen,
  onClose,
  member,
  familyId,
  dict,
}: EditRoleDialogProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectOperationLoading("updateRole"));
  const error = useAppSelector(selectOperationError("updateRole"));
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [selectedRole, setSelectedRole] = useState<"Parent" | "Child">(
    member?.role || "Child",
  );

  useEffect(() => {
    if (member) {
      setSelectedRole(member.role);
    }
  }, [member]);

  const handleSave = async () => {
    if (!member || selectedRole === member.role) return;

    try {
      await dispatch(
        updateMemberRole({
          familyId,
          memberId: member.memberId,
          role: selectedRole,
        }),
      ).unwrap();

      toast.success(dict.editRoleDialog.success);
      onClose();
    } catch (_err) {
      toast.error(dict.errors.updateRoleFailed, {
        description: error || undefined,
      });
    }
  };

  const header = (
    <>
      <DialogTitle>{dict.editRoleDialog.title}</DialogTitle>
      <DialogDescription>{dict.editRoleDialog.description}</DialogDescription>
    </>
  );

  const FormContent = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>{dict.editRoleDialog.currentRole}</Label>
        <p className="text-sm text-muted-foreground">
          {member?.role === "Parent"
            ? dict.memberCard.roleParent
            : dict.memberCard.roleChild}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{dict.editRoleDialog.newRole}</Label>
        <Select
          value={selectedRole}
          onValueChange={(value: "Parent" | "Child") => setSelectedRole(value)}
        >
          <SelectTrigger id="role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Parent">{dict.memberCard.roleParent}</SelectItem>
            <SelectItem value="Child">{dict.memberCard.roleChild}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        {dict.editRoleDialog.cancel}
      </Button>
      <Button
        onClick={handleSave}
        disabled={isLoading || !member || selectedRole === member.role}
      >
        {dict.editRoleDialog.save}
      </Button>
    </>
  );

  // Desktop: Dialog
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>{header}</DialogHeader>
          {FormContent}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Drawer
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">
          {FormContent}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            onClick={handleSave}
            disabled={isLoading || !member || selectedRole === member.role}
          >
            {dict.editRoleDialog.save}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {dict.editRoleDialog.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
