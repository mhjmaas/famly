"use client";

import { useEffect, useMemo, useState } from "react";
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
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { UserProfile } from "@/lib/api-client";
import { updateProfile } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/slices/user.slice";

interface EditProfileDialogProps {
  user: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleLabel: string;
}

function formatDateForInput(isoDate?: string): string {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export function EditProfileDialog({
  user,
  open,
  onOpenChange,
  roleLabel,
}: EditProfileDialogProps) {
  const dispatch = useAppDispatch();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    birthdate: formatDateForInput(user.birthdate),
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        birthdate: formatDateForInput(user.birthdate),
      });
    }
  }, [open, user.birthdate, user.name]);

  const canSave = useMemo(() => {
    return Boolean(formData.name && formData.birthdate) && !isSaving;
  }, [formData, isSaving]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await updateProfile({
        name: formData.name,
        birthdate: formData.birthdate,
      });
      dispatch(setUser(response.user));
      handleClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const header = (
    <>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>Update your profile information</DialogDescription>
    </>
  );

  const fields = (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Name</Label>
        <Input
          id="edit-name"
          placeholder="Enter name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-birthdate">Birthdate</Label>
        <Input
          id="edit-birthdate"
          type="date"
          value={formData.birthdate}
          onChange={(e) =>
            setFormData({ ...formData, birthdate: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role">Role</Label>
        <Input id="edit-role" value={roleLabel} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">
          Role cannot be changed here. Contact a family admin to update your
          role.
        </p>
      </div>
    </div>
  );

  const footerButtons = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isSaving}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={!canSave}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
        <DialogContent>
          <DialogHeader>{header}</DialogHeader>
          {fields}
          <DialogFooter>{footerButtons}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => !next && handleClose()}
      repositionInputs={false}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">{fields}</div>
        <DrawerFooter className="pt-2">
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
