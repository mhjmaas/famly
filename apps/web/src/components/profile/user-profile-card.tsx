"use client";

import { Edit, KeyRound, LogOut, MoreVertical, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/i18n/config";
import type { UserProfile } from "@/lib/api-client";
import { logout } from "@/lib/api-client";
import { calculateAge } from "@/lib/utils/family-utils";
import { useAppDispatch } from "@/store/hooks";
import { clearUser } from "@/store/slices/user.slice";
import { ChangePasswordDialog } from "./change-password-dialog";
import { EditProfileDialog } from "./edit-profile-dialog";

interface UserProfileCardProps {
  user: UserProfile;
  karma: number;
  dict: {
    karma: string;
    yearsOld: string;
    parent: string;
    child: string;
    security: {
      changePassword: {
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
    };
  };
  lang: Locale;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserProfileCard({
  user,
  karma,
  dict,
  lang,
}: UserProfileCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const age = user.birthdate ? calculateAge(user.birthdate) : null;
  const role = user.families?.[0]?.role || "Parent";
  const roleLabel = role.toLowerCase() === "parent" ? dict.parent : dict.child;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      dispatch(clearUser());
      router.push(`/${lang}/signin`);
    } catch (error) {
      console.error("Logout failed:", error);
      dispatch(clearUser());
      router.push(`/${lang}/signin`);
    }
  };

  return (
    <>
      <Card data-testid="user-profile-card">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24" data-testid="profile-user-avatar">
                <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <h2
                  className="text-2xl font-bold"
                  data-testid="profile-user-name"
                >
                  {user.name}
                </h2>
                <div className="flex items-center gap-3">
                  {age !== null && (
                    <p
                      className="text-muted-foreground"
                      data-testid="profile-user-age"
                    >
                      {age} {dict.yearsOld}
                    </p>
                  )}
                  <Badge
                    variant={
                      role.toLowerCase() === "parent" ? "default" : "secondary"
                    }
                    data-testid="profile-user-role"
                  >
                    {roleLabel}
                  </Badge>
                </div>
                <div
                  className="flex items-center gap-2 text-primary"
                  data-testid="profile-user-karma"
                >
                  <Sparkles
                    className="h-5 w-5 fill-primary"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-lg">
                    {karma} {dict.karma}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Profile menu"
                  data-testid="profile-menu-button"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsEditOpen(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="gap-2"
                  data-testid="profile-change-password"
                >
                  <KeyRound className="h-4 w-4" />
                  {dict.security.changePassword.menuLabel}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>

      <EditProfileDialog
        user={user}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        roleLabel={roleLabel}
      />

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
        dict={dict.security.changePassword}
        lang={lang}
      />
    </>
  );
}
