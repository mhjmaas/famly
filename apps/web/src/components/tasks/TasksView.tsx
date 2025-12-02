"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTaskAssignment } from "@/hooks/useTaskAssignment";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useTaskForm } from "@/hooks/useTaskForm";
import { useTaskGroups } from "@/hooks/useTaskGroups";
import type { Dictionary } from "@/i18n/types";
import {
  canCompleteTask,
  getTaskCompletionBlockedReason,
  getTaskKarmaRecipient,
} from "@/lib/utils/task-completion-utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectKarmaBalance } from "@/store/slices/karma.slice";
import {
  completeTask,
  deleteSchedule,
  deleteTask,
  fetchSchedules,
  fetchTasks,
  reopenTask,
  selectSchedules,
  selectTasks,
  selectTasksError,
  selectTasksLoading,
  updateTask,
} from "@/store/slices/tasks.slice";
import type { Task } from "@/types/api.types";
import { CreateTaskDialog } from "./create-task-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { EmptyState } from "./EmptyState";
import type { FilterType } from "./TaskFilters";
import { TaskFilters } from "./TaskFilters";
import { TaskGroup } from "./TaskGroup";

interface TasksViewProps {
  dict: Dictionary;
  familyId: string;
  userId: string;
  userRole: "parent" | "child";
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
}

export function TasksView({
  dict,
  familyId,
  userId,
  userRole,
  familyMembers,
}: TasksViewProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalizedRole = (userRole.charAt(0).toUpperCase() +
    userRole.slice(1)) as "Parent" | "Child";

  const tasks = useAppSelector(selectTasks);
  const _schedules = useAppSelector(selectSchedules);
  const isLoading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const _karmaBalance = useAppSelector(selectKarmaBalance(userId));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>(() => {
    const paramFilter = searchParams?.get("filter");
    const validFilters: FilterType[] = [
      "my-tasks",
      "all",
      "active",
      "completed",
    ];
    return (
      paramFilter && validFilters.includes(paramFilter as FilterType)
        ? paramFilter
        : "my-tasks"
    ) as FilterType;
  });
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  const setFilterInUrl = useCallback(
    (newFilter: FilterType) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (newFilter && newFilter !== "my-tasks") {
        params.set("filter", newFilter);
      } else {
        params.delete("filter");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  // Sync filter with URL changes (back/forward nav)
  useEffect(() => {
    const paramFilter = searchParams?.get("filter");
    const validFilters: FilterType[] = [
      "my-tasks",
      "all",
      "active",
      "completed",
    ];
    if (paramFilter && validFilters.includes(paramFilter as FilterType)) {
      setFilter(paramFilter as FilterType);
    } else {
      setFilter("my-tasks");
    }
  }, [searchParams]);

  // Use custom hooks
  const {
    isTaskAssignedToCurrentUser,
    getAssignmentDisplay,
    getDueDateDisplay,
    isTaskClaimable,
    buildAssignment,
  } = useTaskAssignment({ userId, userRole, familyMembers, dict });

  const { filteredTasks, taskCounts } = useTaskFilters({
    tasks,
    filter,
    isTaskAssignedToCurrentUser,
  });

  const { taskGroups, formatDateSeparator } = useTaskGroups({
    tasks: filteredTasks,
    filter,
  });

  const taskForm = useTaskForm({
    familyId,
    dict,
    dispatch,
    buildAssignment,
    onSuccess: () => {
      setIsCreateOpen(false);
      setEditingTask(null);
    },
  });

  useEffect(() => {
    if (familyId) {
      dispatch(fetchTasks(familyId));
      dispatch(fetchSchedules(familyId));
    }
  }, [dispatch, familyId]);

  useEffect(() => {
    if (hasInitializedFilter) return;
    if (isLoading) return;

    const defaultFilter: FilterType =
      taskCounts.myTasks > 0 ? "my-tasks" : "all";

    if (filter !== defaultFilter) {
      setFilter(defaultFilter);
    }
    setHasInitializedFilter(true);
  }, [filter, hasInitializedFilter, isLoading, taskCounts.myTasks]);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    taskForm.loadTaskForEdit(task);
    setIsCreateOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    if (task.scheduleId) {
      setDeleteConfirmTask(task);
    } else {
      dispatch(deleteTask({ familyId, taskId: task._id }));
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    }
  };

  const handleDeleteSingleInstance = async () => {
    if (!deleteConfirmTask) return;

    try {
      await dispatch(
        deleteTask({ familyId, taskId: deleteConfirmTask._id }),
      ).unwrap();
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successSingle);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  const handleDeleteAllRecurring = async () => {
    if (!deleteConfirmTask?.scheduleId) return;

    try {
      await dispatch(
        deleteSchedule({ familyId, scheduleId: deleteConfirmTask.scheduleId }),
      ).unwrap();
      const tasksToDelete = tasks.filter(
        (t) => t.scheduleId === deleteConfirmTask.scheduleId,
      );
      await Promise.all(
        tasksToDelete.map((t) =>
          dispatch(deleteTask({ familyId, taskId: t._id })),
        ),
      );
      setDeleteConfirmTask(null);
      toast.success(dict.dashboard.pages.tasks.delete.successRecurring);
    } catch (_err) {
      toast.error(dict.dashboard.pages.tasks.delete.error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    const isCompleting = !task.completedAt;

    // Check authorization before completing
    if (isCompleting && !canCompleteTask(task, userId, normalizedRole)) {
      const reason = getTaskCompletionBlockedReason(
        task,
        userId,
        normalizedRole,
      );
      toast.error(reason || "You don't have permission to complete this task");
      return;
    }

    try {
      if (isCompleting) {
        await dispatch(
          completeTask({
            familyId,
            taskId: task._id,
            task, // Pass full task object
            userId,
            karma: task.metadata?.karma,
            isRewardClaim: !!task.metadata?.claimId,
          }),
        ).unwrap();

        // Determine who receives karma for the toast message
        const creditedUserId = getTaskKarmaRecipient(task, userId);
        const isCompletingForOther = creditedUserId !== userId;
        const recipientName = isCompletingForOther
          ? familyMembers.find((m) => m.id === creditedUserId)?.name || "them"
          : "you";

        if (task.metadata?.karma) {
          const karmaMessage = isCompletingForOther
            ? `Task completed! ${recipientName} earned ${task.metadata.karma} karma`
            : dict.dashboard.pages.tasks.complete.successWithKarma.replace(
                "{karma}",
                task.metadata.karma.toString(),
              );
          toast.success(karmaMessage);
        } else {
          toast.success(dict.dashboard.pages.tasks.complete.success);
        }
      } else {
        await dispatch(
          reopenTask({
            familyId,
            taskId: task._id,
            task, // Pass full task object
            userId,
            karma: task.metadata?.karma,
            isRewardClaim: !!task.metadata?.claimId,
          }),
        ).unwrap();
        toast.success(dict.dashboard.pages.tasks.complete.reopen);
      }
    } catch (_err) {
      toast.error("Failed to update task");
    }
  };

  const handleClaimTask = async (task: Task) => {
    try {
      await dispatch(
        updateTask({
          familyId,
          taskId: task._id,
          data: {
            assignment: { type: "member", memberId: userId },
          },
        }),
      ).unwrap();
      toast.success(
        dict.dashboard.pages.tasks.claim.success.replace("{name}", task.name),
      );
    } catch (_err) {
      toast.error("Failed to claim task");
    }
  };

  const handleRefresh = async () => {
    if (familyId) {
      await dispatch(fetchTasks(familyId));
      await dispatch(fetchSchedules(familyId));
    }
  };

  const t = dict.dashboard.pages.tasks;

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6" data-testid="tasks-page">
        <div
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          data-testid="tasks-header"
        >
          <div>
            <h1
              className="hidden sm:block text-3xl font-bold"
              data-testid="tasks-title"
            >
              {t.title}
            </h1>
            <p
              className="text-muted-foreground text-center sm:text-left"
              data-testid="tasks-description"
            >
              {t.description}
            </p>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="hidden sm:flex gap-2"
            data-testid="tasks-create-button"
          >
            <Plus className="h-4 w-4" />
            {t.newTask}
          </Button>
        </div>

        <Tabs
          value={filter}
          onValueChange={(v) => {
            const newFilter = v as FilterType;
            setFilter(newFilter);
            setFilterInUrl(newFilter);
            setHasInitializedFilter(true);
          }}
          data-testid="tasks-tabs"
        >
          <TaskFilters taskCounts={taskCounts} dict={dict} />

          <TabsContent
            value={filter}
            className="space-y-4 mt-6"
            data-testid="tasks-tab-content"
          >
            {isLoading && filteredTasks.length === 0 && (
              <div className="text-center py-12" data-testid="tasks-loading">
                {t.loading}
              </div>
            )}
            {error && (
              <div
                className="text-center py-12 text-destructive"
                data-testid="tasks-error"
              >
                {error}
              </div>
            )}

            {!isLoading && !error && filteredTasks.length === 0 ? (
              <EmptyState
                filter={filter}
                onCreateTask={() => setIsCreateOpen(true)}
                dict={dict}
              />
            ) : (
              <div className="space-y-6" data-testid="tasks-list">
                {taskGroups.map((group) => (
                  <TaskGroup
                    key={group.tasks.map((task) => task._id).join(",")}
                    date={group.date}
                    tasks={group.tasks}
                    userId={userId}
                    userRole={normalizedRole}
                    formatDateSeparator={formatDateSeparator}
                    onToggleComplete={handleToggleComplete}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onClaim={handleClaimTask}
                    isClaimable={isTaskClaimable}
                    getAssignmentDisplay={getAssignmentDisplay}
                    getDueDateDisplay={getDueDateDisplay}
                    dict={dict}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="w-full sm:hidden gap-2"
          data-testid="tasks-create-button-mobile"
        >
          <Plus className="h-4 w-4" />
          {t.newTask}
        </Button>

        <CreateTaskDialog
          isOpen={isCreateOpen || !!editingTask}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingTask(null);
            taskForm.resetForm();
          }}
          editingTask={editingTask}
          formData={taskForm.formData}
          setFormData={taskForm.setFormData}
          showDescription={taskForm.showDescription}
          setShowDescription={taskForm.setShowDescription}
          showDueDate={taskForm.showDueDate}
          setShowDueDate={taskForm.setShowDueDate}
          showAssignment={taskForm.showAssignment}
          setShowAssignment={taskForm.setShowAssignment}
          showKarma={taskForm.showKarma}
          setShowKarma={taskForm.setShowKarma}
          selectedDays={taskForm.selectedDays}
          toggleDay={taskForm.toggleDay}
          dayMap={taskForm.dayMap}
          weekFrequency={taskForm.weekFrequency}
          setWeekFrequency={taskForm.setWeekFrequency}
          resetForm={taskForm.resetForm}
          handleCreateTask={taskForm.handleCreateTask}
          handleCreateSchedule={taskForm.handleCreateSchedule}
          handleUpdateTask={taskForm.handleUpdateTask}
          familyMembers={familyMembers}
          userRole={userRole}
          dict={dict}
        />

        <DeleteTaskDialog
          isOpen={!!deleteConfirmTask}
          onClose={() => setDeleteConfirmTask(null)}
          task={deleteConfirmTask}
          onDeleteSingle={handleDeleteSingleInstance}
          onDeleteAll={handleDeleteAllRecurring}
          dict={dict}
        />
      </div>
    </PullToRefresh>
  );
}
