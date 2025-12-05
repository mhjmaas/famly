import type { Dictionary } from "@/i18n/types";
import {
  canCompleteTask,
  getTaskCompletionBlockedReason,
} from "@/lib/utils/task-completion-utils";
import type { Task } from "@/types/api.types";
import { TaskCard } from "./task-card";

interface TaskGroupProps {
  date: Date | null;
  tasks: Task[];
  userId: string;
  userRole: "Parent" | "Child";
  formatDateSeparator: (date: Date) => string;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClaim: (task: Task) => void;
  isClaimable: (task: Task) => boolean;
  getAssignmentDisplay: (task: Task) => React.ReactNode;
  getDueDateDisplay: (task: Task) => React.ReactNode;
  dict: Dictionary;
}

export function TaskGroup({
  date,
  tasks,
  userId,
  userRole,
  formatDateSeparator,
  onToggleComplete,
  onEdit,
  onDelete,
  onClaim,
  isClaimable,
  getAssignmentDisplay,
  getDueDateDisplay,
  dict,
}: TaskGroupProps) {
  return (
    <div className="space-y-3" data-testid="tasks-group">
      {date && (
        <div
          className="flex items-center gap-3 py-2"
          data-testid="tasks-group-separator"
        >
          <div className="h-px bg-border flex-1" />
          <span className="text-sm font-medium text-muted-foreground">
            Completed {formatDateSeparator(date)}
          </span>
          <div className="h-px bg-border flex-1" />
        </div>
      )}
      {tasks.map((task) => {
        const canComplete = canCompleteTask(task, userId, userRole);
        return (
          <TaskCard
            key={task._id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
            onClaim={onClaim}
            isClaimable={isClaimable}
            canComplete={canComplete}
            completionBlockedReason={
              !canComplete
                ? getTaskCompletionBlockedReason(task, userId, userRole) ||
                  undefined
                : undefined
            }
            getAssignmentDisplay={getAssignmentDisplay}
            getDueDateDisplay={getDueDateDisplay}
            dict={dict}
          />
        );
      })}
    </div>
  );
}
