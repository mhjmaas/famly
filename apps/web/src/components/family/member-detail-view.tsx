"use client";

import { ArrowLeft, MoreVertical, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateAge, getInitials } from "@/lib/utils/family-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMemberActivityEvents,
  selectMemberActivities,
  selectMemberActivitiesLoading,
} from "@/store/slices/activities.slice";
import {
  selectCurrentFamily,
  selectFamilyMemberById,
} from "@/store/slices/family.slice";
import { selectKarmaBalance } from "@/store/slices/karma.slice";
import { selectUser } from "@/store/slices/user.slice";
import { ActivityTimeline } from "../profile/activity-timeline";
import { EditRoleDialog } from "./edit-role-dialog";
import { MemberKarmaCard } from "./member-karma-card";
import { RemoveMemberDialog } from "./remove-member-dialog";

interface MemberDetailViewProps {
  memberId: string;
  dict: {
    pages: {
      memberDetail: {
        backToFamily: string;
        breadcrumbs: {
          familyMembers: string;
        };
        tabs: {
          giveKarma: string;
        };
        actions: {
          editMember: string;
          removeMember: string;
        };
        karmaCard: {
          amountLabel: string;
          amountPlaceholder: string;
          amountHelper: string;
          descriptionLabel: string;
          descriptionPlaceholder: string;
          giveButton: string;
          success: string;
          error: string;
        };
      };
      family: {
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
          updateRoleFailed: string;
          removeFailed: string;
        };
      };
    };
  };
  lang: string;
}

export function MemberDetailView({
  memberId,
  dict,
  lang,
}: MemberDetailViewProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);
  const member = useAppSelector(selectFamilyMemberById(memberId));
  const memberKarma = useAppSelector(selectKarmaBalance(memberId));
  const memberActivities = useAppSelector(selectMemberActivities(memberId));
  const activitiesLoading = useAppSelector(
    selectMemberActivitiesLoading(memberId),
  );

  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);

  // Fetch member activity events on mount
  useEffect(() => {
    if (currentFamily?.familyId && memberId) {
      dispatch(
        fetchMemberActivityEvents({
          familyId: currentFamily.familyId,
          memberId,
        }),
      );
    }
  }, [dispatch, currentFamily?.familyId, memberId]);

  // Get current user's role in the current family
  const currentUserRole =
    currentFamily && user?.families
      ? user.families.find((f) => f.familyId === currentFamily.familyId)
          ?.role === "Parent"
        ? "Parent"
        : "Child"
      : "Child";

  const isParent = currentUserRole === "Parent";

  if (!member) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-muted-foreground">Member not found</p>
      </div>
    );
  }

  const age = calculateAge(member.birthdate);
  const initials = getInitials(member.name);

  return (
    <div className="space-y-6">
      {/* Back Button - Mobile */}
      <div className="lg:hidden -mx-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-2"
          data-testid="back-to-family-button"
        >
          <Link href={`/${lang}/app/family`}>
            <ArrowLeft className="h-4 w-4" />
            {dict.pages.memberDetail.backToFamily}
          </Link>
        </Button>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1
            className="text-3xl font-bold text-foreground"
            data-testid="member-detail-name"
          >
            {member.name}
          </h1>
          <p
            className="text-muted-foreground sm:text-left"
            data-testid="member-detail-age"
          >
            {age} years old
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Karma Display */}
          <div
            className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full"
            data-testid="member-detail-karma"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg text-primary">
              {memberKarma} Karma
            </span>
          </div>

          <Avatar className="h-14 w-14" data-testid="member-detail-avatar">
            <AvatarFallback className="text-sm font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Breadcrumbs - Desktop */}
      <div className="hidden lg:block" data-testid="breadcrumb-navigation">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/${lang}/app/family`}
                  data-testid="breadcrumb-family-members"
                >
                  {dict.pages.memberDetail.breadcrumbs.familyMembers}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage data-testid="breadcrumb-current-member">
                {member.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Tabs with Actions Menu - Only show for parents */}
      {isParent && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-center">
            <Tabs defaultValue="karma" className="w-full max-w-md">
              <TabsList className="w-full">
                <TabsTrigger
                  value="karma"
                  className="flex-1"
                  data-testid="give-karma-tab"
                >
                  {dict.pages.memberDetail.tabs.giveKarma}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                data-testid="member-actions-button"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setIsEditRoleDialogOpen(true)}
                data-testid="action-edit-member"
              >
                {dict.pages.memberDetail.actions.editMember}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setIsRemoveMemberDialogOpen(true)}
                className="text-destructive focus:text-destructive"
                data-testid="action-remove-member"
              >
                {dict.pages.memberDetail.actions.removeMember}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Tab Content - Only show for parents */}
      {isParent && (
        <Tabs defaultValue="karma" className="w-full">
          <TabsContent value="karma" className="mt-0">
            <MemberKarmaCard
              member={member}
              familyId={currentFamily?.familyId || ""}
              isParent={isParent}
              dict={dict}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Activity Timeline */}
      {activitiesLoading && memberActivities.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading activities...</p>
        </div>
      ) : (
        <ActivityTimeline
          events={memberActivities}
          dict={{
            title: "Activity Timeline",
            subtitle: "Recent tasks, rewards, and karma changes",
            noEvents: "No activity yet",
          }}
          locale={lang}
          timeZone="UTC"
        />
      )}

      {/* Dialogs */}
      {currentFamily && (
        <>
          <EditRoleDialog
            isOpen={isEditRoleDialogOpen}
            onClose={() => setIsEditRoleDialogOpen(false)}
            member={member}
            familyId={currentFamily.familyId}
            dict={dict.pages.family}
          />

          <RemoveMemberDialog
            isOpen={isRemoveMemberDialogOpen}
            onClose={() => setIsRemoveMemberDialogOpen(false)}
            member={member}
            familyId={currentFamily.familyId}
            dict={dict.pages.family}
          />
        </>
      )}
    </div>
  );
}
