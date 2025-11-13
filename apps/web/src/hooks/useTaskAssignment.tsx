import { format } from "date-fns";
import { Clock, User, UsersIcon } from "lucide-react";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import type { Dictionary } from "@/i18n/types";
import type { Task, TaskAssignment } from "@/types/api.types";

interface UseTaskAssignmentParams {
  userId: string;
  userRole: "parent" | "child";
  familyMembers: Array<{ id: string; name: string; role: "parent" | "child" }>;
  dict: Dictionary;
}

export function useTaskAssignment({
  userId,
  userRole,
  familyMembers,
  dict,
}: UseTaskAssignmentParams) {
  const isTaskAssignedToCurrentUser = useCallback(
    (task: Task) => {
      if (task.assignment.type === "member") {
        return task.assignment.memberId === userId;
      }
      if (task.assignment.type === "role") {
        return task.assignment.role === userRole;
      }
      return false;
    },
    [userId, userRole],
  );

  const getAssignmentDisplay = useCallback(
    (task: Task) => {
      const assignment = task.assignment;
      const t = dict.dashboard.pages.tasks;

      if (assignment.type === "member") {
        const member = familyMembers.find((m) => m.id === assignment.memberId);
        return (
          <Badge
            variant="secondary"
            className="gap-1 h-7"
            data-testid="task-assignment"
          >
            <User className="h-3 w-3" />
            {member?.name || "Unknown"}
          </Badge>
        );
      }
      if (assignment.type === "role") {
        return (
          <Badge
            variant="secondary"
            className="gap-1 h-7"
            data-testid="task-assignment"
          >
            <UsersIcon className="h-3 w-3" />
            {assignment.role === "parent"
              ? t.badges.allParents
              : t.badges.allChildren}
          </Badge>
        );
      }
      return (
        <Badge
          variant="outline"
          className="gap-1 h-7"
          data-testid="task-assignment"
        >
          {t.badges.unassigned}
        </Badge>
      );
    },
    [dict.dashboard.pages.tasks, familyMembers],
  );

  const getDueDateDisplay = useCallback((task: Task) => {
    if (!task.dueDate) return null;
    const dueDate = new Date(task.dueDate);
    const isOverdue = dueDate < new Date() && !task.completedAt;
    return (
      <Badge
        variant={isOverdue ? "destructive" : "outline"}
        className="gap-1 h-7"
        data-testid="task-due-date"
      >
        <Clock className="h-3 w-3" />
        {format(dueDate, "MMM d")}
      </Badge>
    );
  }, []);

  const isTaskClaimable = useCallback(
    (task: Task) => {
      if (task.completedAt) return false;

      // Can claim unassigned tasks
      if (task.assignment.type === "unassigned") return true;

      // Can claim role-based tasks only if they match current user's role
      if (task.assignment.type === "role") {
        return task.assignment.role === userRole;
      }

      return false;
    },
    [userRole],
  );

  const buildAssignment = useCallback((assignTo: string): TaskAssignment => {
    if (assignTo === "unassigned") {
      return { type: "unassigned" };
    }
    if (assignTo === "all-parents") {
      return { type: "role", role: "parent" };
    }
    if (assignTo === "all-children") {
      return { type: "role", role: "child" };
    }
    return { type: "member", memberId: assignTo };
  }, []);

  return {
    isTaskAssignedToCurrentUser,
    getAssignmentDisplay,
    getDueDateDisplay,
    isTaskClaimable,
    buildAssignment,
  };
}
