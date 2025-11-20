"use client";

import { useCallback, useEffect, useState } from "react";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { canCompleteTask } from "@/lib/utils/task-completion-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectPendingTasksCount,
  selectPendingTasksForUser,
  selectPotentialKarma,
} from "@/store/selectors/dashboard.selectors";
import { fetchContributionGoal } from "@/store/slices/contribution-goals.slice";
import { selectKarmaBalance } from "@/store/slices/karma.slice";
import {
  fetchRewards,
  selectFavouritedRewards,
} from "@/store/slices/rewards.slice";
import {
  completeTask,
  fetchTasks,
  reopenTask,
} from "@/store/slices/tasks.slice";
import { selectUser } from "@/store/slices/user.slice";
import type { Task } from "@/types/api.types";
import { ContributionGoalSection } from "./contribution-goal-section";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSummaryCards } from "./dashboard-summary-cards";
import { PendingTasksSection } from "./pending-tasks-section";
import { RewardProgressSection } from "./reward-progress-section";

interface DashboardOverviewProps {
  lang: string;
  dict: {
    dashboard: {
      pages: {
        dashboard: {
          welcome: string;
          subtitle: string;
          summary: {
            availableKarma: string;
            pendingTasks: string;
            potentialKarma: string;
          };
          sections: {
            yourPendingTasks: string;
            rewardProgress: string;
            viewAll: string;
          };
          emptyStates: {
            noTasks: string;
            noTasksDescription: string;
            noRewards: string;
            noRewardsDescription: string;
          };
          reward: {
            ready: string;
            remaining: string;
          };
        };
      };
    };
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

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function DashboardOverview({ lang, dict }: DashboardOverviewProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  // Track recently completed task IDs to keep showing them temporarily
  const [recentlyCompletedIds, setRecentlyCompletedIds] = useState<Set<string>>(
    new Set(),
  );

  const userKarma = useAppSelector((state) =>
    user ? selectKarmaBalance(user.id)(state) : 0,
  );
  const pendingTasks = useAppSelector((state) =>
    selectPendingTasksForUser(state, recentlyCompletedIds),
  );
  const pendingTasksCount = useAppSelector(selectPendingTasksCount);
  const potentialKarma = useAppSelector(selectPotentialKarma);
  const favoritedRewards = useAppSelector(selectFavouritedRewards);

  const tasksLastFetch = useAppSelector((state) => state.tasks.lastFetch);
  const rewardsLastFetch = useAppSelector((state) => state.rewards.lastFetch);

  useEffect(() => {
    if (!user?.families?.[0]?.familyId) return;

    const familyId = user.families[0].familyId;
    const now = Date.now();

    // Fetch tasks if stale
    if (!tasksLastFetch || now - tasksLastFetch > STALE_TIME) {
      dispatch(fetchTasks(familyId));
    }

    // Fetch rewards if stale
    if (!rewardsLastFetch || now - rewardsLastFetch > STALE_TIME) {
      dispatch(fetchRewards(familyId));
    }
  }, [dispatch, user, tasksLastFetch, rewardsLastFetch]);

  const handleRefresh = useCallback(async () => {
    if (!user?.families?.[0]?.familyId || !user?.id) return;

    const familyId = user.families[0].familyId;
    await Promise.all([
      dispatch(fetchTasks(familyId)),
      dispatch(fetchRewards(familyId)),
      dispatch(fetchContributionGoal({ familyId, memberId: user.id }))
        .unwrap()
        .catch(() => {
          // Goal doesn't exist yet, which is fine
        }),
    ]);
  }, [dispatch, user]);

  const handleToggleComplete = useCallback(
    async (task: Task) => {
      if (!user?.families?.[0]?.familyId) return;

      const familyId = user.families[0].familyId;
      const isCompleting = !task.completedAt;
      const userRole = user.families[0].role;
      const normalizedRole = (userRole.charAt(0).toUpperCase() +
        userRole.slice(1)) as "Parent" | "Child";

      // Check authorization before completing
      if (isCompleting && !canCompleteTask(task, user.id, normalizedRole)) {
        // Silently prevent completion in dashboard - user can navigate to tasks page for details
        return;
      }

      try {
        if (isCompleting) {
          await dispatch(
            completeTask({
              familyId,
              taskId: task._id,
              task, // Pass full task object
              userId: user.id,
              karma: task.metadata?.karma,
              isRewardClaim: !!task.metadata?.claimId,
            }),
          ).unwrap();
          // Add to recently completed set to keep showing it temporarily
          setRecentlyCompletedIds((prev) => new Set(prev).add(task._id));
        } else {
          // Reopen the task
          await dispatch(
            reopenTask({
              familyId,
              taskId: task._id,
              task, // Pass full task object
              userId: user.id,
              karma: task.metadata?.karma,
              isRewardClaim: !!task.metadata?.claimId,
            }),
          ).unwrap();
          // Remove from recently completed set
          setRecentlyCompletedIds((prev) => {
            const next = new Set(prev);
            next.delete(task._id);
            return next;
          });
        }
      } catch (error) {
        console.error("Failed to toggle task completion", error);
      }
    },
    [dispatch, user],
  );

  if (!user) {
    return null;
  }

  const firstName = user.name.split(" ")[0];
  const dashboardDict = dict.dashboard.pages.dashboard;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        <DashboardHeader
          firstName={firstName}
          welcomeMessage={dashboardDict.welcome}
          subtitle={dashboardDict.subtitle}
        />

        <DashboardSummaryCards
          availableKarma={userKarma}
          pendingTasksCount={pendingTasksCount}
          potentialKarma={potentialKarma}
          labels={{
            availableKarma: dashboardDict.summary.availableKarma,
            pendingTasks: dashboardDict.summary.pendingTasks,
            potentialKarma: dashboardDict.summary.potentialKarma,
          }}
        />

        <ContributionGoalSection lang={lang} dict={dict} />

        <div className="grid gap-6 lg:grid-cols-2">
          <PendingTasksSection
            tasks={pendingTasks}
            lang={lang}
            labels={{
              title: dashboardDict.sections.yourPendingTasks,
              viewAll: dashboardDict.sections.viewAll,
              emptyTitle: dashboardDict.emptyStates.noTasks,
              emptyDescription: dashboardDict.emptyStates.noTasksDescription,
            }}
            onToggleComplete={handleToggleComplete}
          />

          <RewardProgressSection
            rewards={favoritedRewards}
            userKarma={userKarma}
            lang={lang}
            labels={{
              title: dashboardDict.sections.rewardProgress,
              viewAll: dashboardDict.sections.viewAll,
              emptyTitle: dashboardDict.emptyStates.noRewards,
              emptyDescription: dashboardDict.emptyStates.noRewardsDescription,
              ready: dashboardDict.reward.ready,
              remaining: dashboardDict.reward.remaining,
            }}
          />
        </div>
      </div>
    </PullToRefresh>
  );
}
