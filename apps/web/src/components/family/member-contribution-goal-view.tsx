"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ContributionGoalCard } from "@/components/contribution-goals/contribution-goal-card";
import { ContributionGoalDeleteDialog } from "@/components/contribution-goals/contribution-goal-delete-dialog";
import { ContributionGoalDialog } from "@/components/contribution-goals/contribution-goal-dialog";
import type { DictionarySection } from "@/i18n/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addDeduction,
  createContributionGoal,
  deleteContributionGoal,
  fetchContributionGoal,
  selectContributionGoalByMemberId,
  selectOperationLoading,
  updateContributionGoal,
} from "@/store/slices/contribution-goals.slice";
import { selectCurrentFamily } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";

interface MemberContributionGoalViewProps {
  memberId: string;
  memberName: string;
  dict: DictionarySection<"contributionGoals">;
}

export function MemberContributionGoalView({
  memberId,
  memberName,
  dict,
}: MemberContributionGoalViewProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: dict.dialog.titlePlaceholder,
    description: "",
    maxKarma: "100",
    recurring: false,
  });

  const goal = useAppSelector((state) =>
    selectContributionGoalByMemberId(state, memberId),
  );

  const isCreating = useAppSelector((state) =>
    selectOperationLoading(state, "create"),
  );
  const isUpdating = useAppSelector((state) =>
    selectOperationLoading(state, "update"),
  );
  const isDeleting = useAppSelector((state) =>
    selectOperationLoading(state, "delete"),
  );
  const isAddingDeduction = useAppSelector((state) =>
    selectOperationLoading(state, "addDeduction"),
  );

  // Check if current user is a parent
  const isParent =
    currentFamily?.members.find((m) => m.memberId === user?.id)?.role ===
    "Parent";

  useEffect(() => {
    if (currentFamily) {
      dispatch(
        fetchContributionGoal({
          familyId: currentFamily.familyId,
          memberId,
        }),
      )
        .unwrap()
        .catch(() => {
          // Goal doesn't exist yet, which is fine
        });
    }
  }, [currentFamily, memberId, dispatch]);

  const handleEdit = useCallback(() => {
    if (goal) {
      setFormData({
        title: goal.title,
        description: goal.description,
        maxKarma: goal.maxKarma.toString(),
        recurring: goal.recurring,
      });
    } else {
      setFormData({
        title: dict.dialog.titlePlaceholder,
        description: "",
        maxKarma: "100",
        recurring: false,
      });
    }
    setIsEditDialogOpen(true);
  }, [goal, dict.dialog.titlePlaceholder]);

  const handleOpenDeleteDialog = useCallback(() => {
    if (!goal) return;
    setIsDeleteDialogOpen(true);
  }, [goal]);

  const handleSave = async () => {
    if (!currentFamily) return;

    const maxKarma = parseInt(formData.maxKarma, 10);
    if (Number.isNaN(maxKarma) || maxKarma < 1 || maxKarma > 10000) {
      toast.error(dict.dialog.invalidKarmaDescription);
      return;
    }

    try {
      if (goal) {
        await dispatch(
          updateContributionGoal({
            familyId: currentFamily.familyId,
            memberId,
            data: {
              title: formData.title,
              description: formData.description,
              maxKarma,
              recurring: formData.recurring,
            },
          }),
        ).unwrap();
        toast.success(dict.dialog.goalUpdatedDescription);
      } else {
        await dispatch(
          createContributionGoal({
            familyId: currentFamily.familyId,
            data: {
              memberId,
              title: formData.title,
              description: formData.description,
              maxKarma,
              recurring: formData.recurring,
            },
          }),
        ).unwrap();
        toast.success(dict.dialog.goalCreatedDescription);
      }
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : dict.dialog.errorSaveFailed,
      );
    }
  };

  const handleDelete = async () => {
    if (!currentFamily) return;

    try {
      await dispatch(
        deleteContributionGoal({
          familyId: currentFamily.familyId,
          memberId,
        }),
      ).unwrap();
      toast.success(dict.dialog.goalDeletedDescription);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : dict.dialog.errorDeleteFailed,
      );
    }
  };

  const handleAddDeduction = async (amount: number, reason: string) => {
    if (!currentFamily) return;

    await dispatch(
      addDeduction({
        familyId: currentFamily.familyId,
        memberId,
        data: { amount, reason },
      }),
    ).unwrap();
  };

  if (!currentFamily) return null;

  return (
    <div className="space-y-4" data-testid="member-contribution-goal-view">
      <ContributionGoalCard
        goal={goal}
        isParent={isParent}
        memberName={memberName}
        onEdit={handleEdit}
        onDeleteGoal={handleOpenDeleteDialog}
        onAddDeduction={handleAddDeduction}
        showQuickDeduction={isParent}
        showCardActions={isParent}
        isActionPending={isDeleting || isAddingDeduction}
        dict={dict}
      />

      <ContributionGoalDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        memberName={memberName}
        mode={goal ? "edit" : "create"}
        formState={formData}
        onFormChange={setFormData}
        onSubmit={handleSave}
        isSubmitting={isCreating || isUpdating}
        dict={dict}
      />

      <ContributionGoalDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        dict={dict}
      />
    </div>
  );
}
