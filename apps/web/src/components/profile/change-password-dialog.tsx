"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { Locale } from "@/i18n/config";
import { ApiError, changePassword, logout } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { clearUser } from "@/store/slices/user.slice";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: {
    menuLabel: string;
    title: string;
    description: string;
    currentLabel: string;
    newLabel: string;
    confirmLabel: string;
    submit: string;
    cancel: string;
    successTitle: string;
    successDescription: string;
    errors: {
      currentRequired: string;
      newRequired: string;
      confirmRequired: string;
      mismatch: string;
      minLength: string;
      reuse: string;
      invalidCurrent: string;
      generic: string;
    };
  };
  lang: Locale;
}

interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const emptyPasswordForm: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function ChangePasswordDialog({
  open,
  onOpenChange,
  dict,
  lang,
}: ChangePasswordDialogProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [passwordForm, setPasswordForm] =
    useState<PasswordFormState>(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<Record<keyof PasswordFormState, string>>
  >({});
  const [passwordServerError, setPasswordServerError] = useState<string | null>(
    null,
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const resetForm = () => {
    setPasswordForm(emptyPasswordForm);
    setPasswordErrors({});
    setPasswordServerError(null);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies(resetForm): suppress dependency resetForm
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const canSubmit = useMemo(() => {
    return (
      passwordForm.newPassword.length >= 8 &&
      passwordForm.confirmPassword.length >= 8 &&
      passwordForm.newPassword === passwordForm.confirmPassword &&
      passwordForm.currentPassword !== passwordForm.newPassword &&
      !isChangingPassword
    );
  }, [passwordForm, isChangingPassword]);

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const updateField = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPasswordErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
    setPasswordServerError(null);
  };

  const validatePasswordForm = () => {
    const errors: Partial<Record<keyof PasswordFormState, string>> = {};
    const strings = dict.errors;

    if (!passwordForm.currentPassword) {
      errors.currentPassword = strings.currentRequired;
    } else if (passwordForm.currentPassword.length < 8) {
      errors.currentPassword = strings.minLength;
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = strings.newRequired;
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = strings.minLength;
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = strings.reuse;
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = strings.confirmRequired;
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = strings.mismatch;
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsChangingPassword(true);
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        revokeOtherSessions: true,
      });

      toast.success(dict.successTitle, {
        description: dict.successDescription,
      });

      handleClose();

      await logout();
      dispatch(clearUser());
      router.push(`/${lang}/signin`);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setPasswordServerError(dict.errors.invalidCurrent);
        } else {
          setPasswordServerError(error.message || dict.errors.generic);
        }
      } else {
        setPasswordServerError(dict.errors.generic);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const header = (
    <>
      <DialogTitle>{dict.title}</DialogTitle>
      <DialogDescription>{dict.description}</DialogDescription>
    </>
  );

  const content = (
    <div className="space-y-4 py-4" data-testid="change-password-form">
      {passwordServerError && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
          data-testid="change-password-error"
        >
          {passwordServerError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="change-password-current">{dict.currentLabel}</Label>
        <Input
          id="change-password-current"
          type="password"
          value={passwordForm.currentPassword}
          onChange={(e) => updateField("currentPassword", e.target.value)}
          data-testid="change-password-current"
        />
        {passwordErrors.currentPassword && (
          <p className="text-sm text-destructive">
            {passwordErrors.currentPassword}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="change-password-new">{dict.newLabel}</Label>
        <Input
          id="change-password-new"
          type="password"
          value={passwordForm.newPassword}
          onChange={(e) => updateField("newPassword", e.target.value)}
          data-testid="change-password-new"
        />
        {passwordErrors.newPassword && (
          <p className="text-sm text-destructive">
            {passwordErrors.newPassword}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="change-password-confirm">{dict.confirmLabel}</Label>
        <Input
          id="change-password-confirm"
          type="password"
          value={passwordForm.confirmPassword}
          onChange={(e) => updateField("confirmPassword", e.target.value)}
          data-testid="change-password-confirm"
        />
        {passwordErrors.confirmPassword && (
          <p className="text-sm text-destructive">
            {passwordErrors.confirmPassword}
          </p>
        )}
      </div>
    </div>
  );

  const footerButtons = (
    <>
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={isChangingPassword}
      >
        {dict.cancel}
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        data-testid="change-password-submit"
      >
        {isChangingPassword ? `${dict.submit}...` : dict.submit}
      </Button>
    </>
  );

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            handleClose();
          }
        }}
      >
        <DialogContent data-testid="change-password-dialog">
          <DialogHeader>{header}</DialogHeader>
          {content}
          <DialogFooter>{footerButtons}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DrawerContent data-testid="change-password-drawer">
        <DrawerHeader className="text-left">{header}</DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[60vh]">{content}</div>
        <DrawerFooter className="pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-testid="change-password-submit"
          >
            {isChangingPassword ? `${dict.submit}...` : dict.submit}
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isChangingPassword}
            >
              {dict.cancel}
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
