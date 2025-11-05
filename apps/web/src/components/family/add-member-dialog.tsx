"use client";

import { useId, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addFamilyMember,
  selectOperationError,
  selectOperationLoading,
} from "@/store/slices/family.slice";

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
  dict: {
    addMemberDialog: {
      title: string;
      description: string;
      email: string;
      emailPlaceholder: string;
      password: string;
      passwordPlaceholder: string;
      name: string;
      namePlaceholder: string;
      birthdate: string;
      birthdatePlaceholder: string;
      role: string;
      roleParent: string;
      roleChild: string;
      cancel: string;
      submit: string;
      success: string;
    };
    errors: {
      addMemberFailed: string;
      invalidEmail: string;
      passwordTooShort: string;
      invalidDate: string;
      futureDateNotAllowed: string;
    };
  };
}

export function AddMemberDialog({
  isOpen,
  onClose,
  familyId,
  dict,
}: AddMemberDialogProps) {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectOperationLoading("addMember"));
  const error = useAppSelector(selectOperationError("addMember"));

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const birthdateId = useId();
  const roleId = useId();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    birthdate: "",
    role: "Child" as "Parent" | "Child",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const handleClose = () => {
    setFormData({
      email: "",
      password: "",
      name: "",
      birthdate: "",
      role: "Child",
    });
    setValidationErrors({});
    onClose();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      errors.email = dict.errors.invalidEmail;
    }

    // Password validation
    if (!formData.password || formData.password.length < 8) {
      errors.password = dict.errors.passwordTooShort;
    }

    // Name validation
    if (!formData.name || formData.name.length > 120) {
      errors.name = "Name is required and must be 120 characters or less";
    }

    // Birthdate validation
    if (!formData.birthdate) {
      errors.birthdate = dict.errors.invalidDate;
    } else {
      const birthdate = new Date(formData.birthdate);
      const today = new Date();
      if (birthdate > today) {
        errors.birthdate = dict.errors.futureDateNotAllowed;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await dispatch(
        addFamilyMember({
          familyId,
          email: formData.email,
          password: formData.password,
          name: formData.name,
          birthdate: formData.birthdate,
          role: formData.role,
        }),
      ).unwrap();

      toast.success(dict.addMemberDialog.success);
      handleClose();
    } catch (_err) {
      toast.error(dict.errors.addMemberFailed, {
        description: error || undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.addMemberDialog.title}</DialogTitle>
          <DialogDescription>
            {dict.addMemberDialog.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor={emailId}>{dict.addMemberDialog.email}</Label>
            <Input
              id={emailId}
              data-testid="add-member-email"
              type="email"
              placeholder={dict.addMemberDialog.emailPlaceholder}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {validationErrors.email && (
              <p className="text-sm text-destructive">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={passwordId}>{dict.addMemberDialog.password}</Label>
            <Input
              id={passwordId}
              data-testid="add-member-password"
              type="password"
              placeholder={dict.addMemberDialog.passwordPlaceholder}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            {validationErrors.password && (
              <p className="text-sm text-destructive">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={nameId}>{dict.addMemberDialog.name}</Label>
            <Input
              id={nameId}
              data-testid="add-member-name"
              placeholder={dict.addMemberDialog.namePlaceholder}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            {validationErrors.name && (
              <p className="text-sm text-destructive">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={birthdateId}>
              {dict.addMemberDialog.birthdate}
            </Label>
            <Input
              id={birthdateId}
              data-testid="add-member-birthdate"
              type="date"
              value={formData.birthdate}
              onChange={(e) =>
                setFormData({ ...formData, birthdate: e.target.value })
              }
            />
            {validationErrors.birthdate && (
              <p className="text-sm text-destructive">
                {validationErrors.birthdate}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={roleId}>{dict.addMemberDialog.role}</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "Parent" | "Child") =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger id={roleId} data-testid="add-member-role-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Parent" data-testid="add-member-role-parent">
                  {dict.addMemberDialog.roleParent}
                </SelectItem>
                <SelectItem value="Child" data-testid="add-member-role-child">
                  {dict.addMemberDialog.roleChild}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-testid="add-member-cancel"
          >
            {dict.addMemberDialog.cancel}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              !formData.email ||
              !formData.password ||
              !formData.name ||
              !formData.birthdate
            }
            data-testid="add-member-submit"
          >
            {dict.addMemberDialog.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
