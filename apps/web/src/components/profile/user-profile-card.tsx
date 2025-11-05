"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, LogOut, MoreVertical, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/api-client";
import { updateProfile } from "@/lib/api-client";
import { useAppDispatch } from "@/store/hooks";
import { clearUser, setUser } from "@/store/slices/user.slice";
import { clearInvalidSession } from "@/lib/auth-actions";
import type { Locale } from "@/i18n/config";

interface UserProfileCardProps {
  user: UserProfile;
  karma: number;
  dict: {
    karma: string;
    yearsOld: string;
    parent: string;
    child: string;
  };
  lang: Locale;
}

function calculateAge(birthdate?: string): number | null {
  if (!birthdate) return null;

  const today = new Date();
  const birth = new Date(birthdate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Convert ISO date string to YYYY-MM-DD format for HTML date input
 */
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

export function UserProfileCard({ user, karma, dict, lang }: UserProfileCardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const age = calculateAge(user.birthdate);
  const role = user.families?.[0]?.role || "Parent";

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    birthdate: formatDateForInput(user.birthdate),
    role: role,
  });

  const handleOpenEdit = () => {
    setFormData({
      name: user.name,
      birthdate: formatDateForInput(user.birthdate),
      role: role,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true);

      // Call API to update profile
      const response = await updateProfile({
        name: formData.name,
        birthdate: formData.birthdate,
      });

      // Update Redux store with new user data
      dispatch(setUser(response.user));

      // Close dialog
      setIsEditOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      // TODO: Show error message to user
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear Redux store
      dispatch(clearUser());

      // Clear session cookie
      await clearInvalidSession();

      // Redirect to signin
      router.push(`/${lang}/signin`);
    } catch (error) {
      console.error("Logout failed:", error);
      // Still redirect even if cookie clearing fails
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
                <h2 className="text-2xl font-bold" data-testid="profile-user-name">{user.name}</h2>
                <div className="flex items-center gap-3">
                  {age !== null && (
                    <p className="text-muted-foreground" data-testid="profile-user-age">
                      {age} {dict.yearsOld}
                    </p>
                  )}
                  <Badge variant={role.toLowerCase() === "parent" ? "default" : "secondary"} data-testid="profile-user-role">
                    {role.toLowerCase() === "parent" ? dict.parent : dict.child}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-primary" data-testid="profile-user-karma">
                  <Sparkles className="h-5 w-5 fill-primary" aria-hidden="true" />
                  <span className="font-semibold text-lg">
                    {karma} {dict.karma}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Profile menu" data-testid="profile-menu-button">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Profile
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile information</DialogDescription>
          </DialogHeader>

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
                onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                value={formData.role}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Role cannot be changed here. Contact a family admin to update your role.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!formData.name || !formData.birthdate || isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
