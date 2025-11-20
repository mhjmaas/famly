"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ContributionGoalCard } from "@/components/contribution-goals/contribution-goal-card";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addDeduction,
  fetchContributionGoal,
  selectContributionGoalByMemberId,
} from "@/store/slices/contribution-goals.slice";
import { selectCurrentFamily } from "@/store/slices/family.slice";
import { selectUser } from "@/store/slices/user.slice";

interface ContributionGoalSectionProps {
  lang: string;
  dict: {
    contributionGoals: {
      emptyState: {
        title: string;
        description: string;
        action: string;
      };
      card: {
        title: string;
        weekOf: string;
        karma: string;
        deductionsCount: string;
        noDeductions: string;
        onTrack: string;
        latestReduction: string;
      };
      dialog: {
        editTitle: string;
        deleteTitle: string;
      };
      deduction: {
        reasonPlaceholder: string;
        action: string;
        success: string;
        successDescription: string;
        errorTitle: string;
        errorInvalidInput: string;
        errorFailed: string;
      };
    };
  };
}

export function ContributionGoalSection({
  lang,
  dict,
}: ContributionGoalSectionProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const goal = useAppSelector((state) =>
    user ? selectContributionGoalByMemberId(state, user.id) : null,
  );

  // Check if user is a parent
  const isParent =
    currentFamily?.members.find((m) => m.memberId === user?.id)?.role ===
    "Parent";

  useEffect(() => {
    if (user && currentFamily && isInitialLoad) {
      dispatch(
        fetchContributionGoal({
          familyId: currentFamily.familyId,
          memberId: user.id,
        }),
      )
        .unwrap()
        .catch(() => {
          // Goal doesn't exist yet, which is fine
        })
        .finally(() => {
          setIsInitialLoad(false);
        });
    }
  }, [user, currentFamily, dispatch, isInitialLoad]);

  const handleEdit = () => {
    // Navigate to member detail page with contribution goal tab
    if (user && currentFamily) {
      router.push(`/${lang}/app/family/${user.id}?tab=contribution-goal`);
    }
  };

  const handleAddDeduction = async (amount: number, reason: string) => {
    if (!user || !currentFamily) return;

    await dispatch(
      addDeduction({
        familyId: currentFamily.familyId,
        memberId: user.id,
        data: { amount, reason },
      }),
    ).unwrap();
  };

  if (!user || !currentFamily) return null;

  return (
    <div
      className="space-y-4"
      data-testid="dashboard-contribution-goal-section"
    >
      <ContributionGoalCard
        goal={goal}
        isParent={isParent}
        memberName={user.name}
        onEdit={handleEdit}
        onAddDeduction={handleAddDeduction}
        showQuickDeduction={false} // Only show on member detail page
        dict={dict.contributionGoals}
      />
    </div>
  );
}
