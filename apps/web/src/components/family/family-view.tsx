"use client";

import { Plus, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { FamilyMember } from "@/lib/api-client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchFamilies,
  selectCurrentFamily,
  selectFamilyError,
  selectFamilyLoading,
  selectFamilyMembers,
} from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";
import { AddMemberDialog } from "./add-member-dialog";
import { EditRoleDialog } from "./edit-role-dialog";
import { FamilyMemberCard } from "./family-member-card";
import { GiveKarmaDialog } from "./give-karma-dialog";
import { RemoveMemberDialog } from "./remove-member-dialog";

interface FamilyViewProps {
  mobileActionTrigger?: number;
  dict: {
    pages: {
      family: {
        title: string;
        description: string;
        addMember: string;
        emptyState: {
          title: string;
          description: string;
        };
        memberCard: {
          yearsOld: string;
          karma: string;
          roleParent: string;
          roleChild: string;
          actions: {
            giveKarma: string;
            editRole: string;
            remove: string;
          };
        };
        editRoleDialog: {
          title: string;
          description: string;
          currentRole: string;
          newRole: string;
          cancel: string;
          save: string;
          success: string;
        };
        removeDialog: {
          title: string;
          description: string;
          warning: string;
          lastParentError: string;
          cancel: string;
          confirm: string;
          success: string;
        };
        giveKarmaDialog: {
          title: string;
          description: string;
          karmaType: string;
          positive: string;
          negative: string;
          amount: string;
          amountPlaceholder: string;
          message: string;
          messagePlaceholder: string;
          messageRequired: string;
          cancel: string;
          submit: string;
        };
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
          loadFailed: string;
          updateRoleFailed: string;
          removeFailed: string;
          grantKarmaFailed: string;
          addMemberFailed: string;
          unauthorized: string;
          notFound: string;
          invalidAmount: string;
          invalidEmail: string;
          passwordTooShort: string;
          invalidDate: string;
          futureDateNotAllowed: string;
        };
      };
    };
  };
}

export function FamilyView({ mobileActionTrigger, dict }: FamilyViewProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);
  const members = useAppSelector(selectFamilyMembers);
  const isLoading = useAppSelector(selectFamilyLoading);
  const error = useAppSelector(selectFamilyError);

  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [isGiveKarmaDialogOpen, setIsGiveKarmaDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(
    null,
  );

  // Get current user's role in the current family
  const currentUserRole =
    currentFamily && user?.families
      ? user.families.find((f) => f.familyId === currentFamily.familyId)
          ?.role === "Parent"
        ? "Parent"
        : "Child"
      : "Child";

  const isParent = currentUserRole === "Parent";

  useEffect(() => {
    dispatch(fetchFamilies());
  }, [dispatch]);

  useEffect(() => {
    if (mobileActionTrigger && mobileActionTrigger > 0) {
      setIsAddMemberDialogOpen(true);
    }
  }, [mobileActionTrigger]);

  const handleRefresh = async () => {
    await dispatch(fetchFamilies());
  };

  const handleEditRole = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsEditRoleDialogOpen(true);
  };

  const handleRemove = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsRemoveMemberDialogOpen(true);
  };

  const handleGiveKarma = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsGiveKarmaDialogOpen(true);
  };

  // Only show loading state on initial load (when members is empty)
  // Subsequent refetches (e.g., from realtime events) update silently in the background
  if (isLoading && members.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive">
          {dict.pages.family.errors.loadFailed}
        </p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="hidden sm:block text-3xl font-bold text-foreground"
              data-testid="family-title"
            >
              {dict.pages.family.title}
            </h1>
            <p
              className="text-muted-foreground text-center sm:text-left"
              data-testid="family-description"
            >
              {dict.pages.family.description}
            </p>
          </div>
          {isParent && (
            <Button
              onClick={() => setIsAddMemberDialogOpen(true)}
              className="hidden sm:flex"
              data-testid="add-member-button"
            >
              <Plus className="mr-2 h-4 w-4" />
              {dict.pages.family.addMember}
            </Button>
          )}
        </div>

        {members.length === 0 ? (
          <Card data-testid="family-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <UserPlus className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-1">
                {dict.pages.family.emptyState.title}
              </p>
              <p className="text-sm text-muted-foreground">
                {dict.pages.family.emptyState.description}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            data-testid="family-members-grid"
          >
            {members.map((member) => (
              <FamilyMemberCard
                key={member.memberId}
                member={member}
                currentUserRole={currentUserRole}
                onEditRole={handleEditRole}
                onRemove={handleRemove}
                onGiveKarma={handleGiveKarma}
                dict={dict.pages.family}
              />
            ))}
          </div>
        )}

        {isParent && (
          <Button
            onClick={() => setIsAddMemberDialogOpen(true)}
            className="w-full sm:hidden"
            data-testid="add-member-button-mobile"
          >
            <Plus className="mr-2 h-4 w-4" />
            {dict.pages.family.addMember}
          </Button>
        )}

        {currentFamily && (
          <>
            <EditRoleDialog
              isOpen={isEditRoleDialogOpen}
              onClose={() => setIsEditRoleDialogOpen(false)}
              member={selectedMember}
              familyId={currentFamily.familyId}
              dict={dict.pages.family}
            />

            <RemoveMemberDialog
              isOpen={isRemoveMemberDialogOpen}
              onClose={() => setIsRemoveMemberDialogOpen(false)}
              member={selectedMember}
              familyId={currentFamily.familyId}
              dict={dict.pages.family}
            />

            <GiveKarmaDialog
              isOpen={isGiveKarmaDialogOpen}
              onClose={() => setIsGiveKarmaDialogOpen(false)}
              member={selectedMember}
              familyId={currentFamily.familyId}
              dict={dict.pages.family}
            />

            <AddMemberDialog
              isOpen={isAddMemberDialogOpen}
              onClose={() => setIsAddMemberDialogOpen(false)}
              familyId={currentFamily.familyId}
              dict={dict.pages.family}
            />
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
