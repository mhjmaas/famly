"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useTaskAssignment } from "@/hooks/useTaskAssignment";
import { useTaskFilters } from "@/hooks/useTaskFilters";
import { useTaskForm } from "@/hooks/useTaskForm";
import { useTaskGroups } from "@/hooks/useTaskGroups";
import type { Dictionary } from "@/i18n/types";
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

  const tasks = useAppSelector(selectTasks);
  const _schedules = useAppSelector(selectSchedules);
  const isLoading = useAppSelector(selectTasksLoading);
  const error = useAppSelector(selectTasksError);
  const _karmaBalance = useAppSelector(selectKarmaBalance(userId));

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<FilterType>("my-tasks");
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

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

    try {
      if (isCompleting) {
        await dispatch(
          completeTask({
            familyId,
            taskId: task._id,
            userId,
            karma: task.metadata?.karma,
            isRewardClaim: !!task.metadata?.claimId,
          }),
        ).unwrap();

        if (task.metadata?.karma) {
          toast.success(
            dict.dashboard.pages.tasks.complete.successWithKarma.replace(
              "{karma}",
              task.metadata.karma.toString(),
            ),
          );
        } else {
          toast.success(dict.dashboard.pages.tasks.complete.success);
        }
      } else {
        await dispatch(
          reopenTask({
            familyId,
            taskId: task._id,
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

  const t = dict.dashboard.pages.tasks;

  return (
    <div className="space-y-6" data-testid="tasks-page">
      <div
        className="hidden lg:flex items-center justify-between"
        data-testid="tasks-header"
      >
        <div>
          <h1 className="text-3xl font-bold" data-testid="tasks-title">
            {t.title}
          </h1>
          <p className="text-muted-foreground" data-testid="tasks-description">
            {t.description}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="gap-2"
          data-testid="tasks-create-button"
        >
          <Plus className="h-4 w-4" />
          {t.newTask}
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(v) => {
          setFilter(v as FilterType);
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
  );
}
