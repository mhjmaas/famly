import { useMemo } from "react";
import type { Task } from "@/types/api.types";
import type { FilterType } from "../TaskFilters";

interface UseTaskFiltersParams {
  tasks: Task[];
  filter: FilterType;
  isTaskAssignedToCurrentUser: (task: Task) => boolean;
}

export function useTaskFilters({
  tasks,
  filter,
  isTaskAssignedToCurrentUser,
}: UseTaskFiltersParams) {
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "my-tasks") {
        return isTaskAssignedToCurrentUser(task);
      }
      if (filter === "active") return !task.completedAt;
      if (filter === "completed") return !!task.completedAt;
      return true;
    });
  }, [filter, isTaskAssignedToCurrentUser, tasks]);

  const taskCounts = useMemo(() => {
    let myTasks = 0;
    let active = 0;
    let completed = 0;

    tasks.forEach((task) => {
      if (isTaskAssignedToCurrentUser(task)) {
        myTasks += 1;
      }
      if (task.completedAt) {
        completed += 1;
      } else {
        active += 1;
      }
    });

    return {
      myTasks,
      all: tasks.length,
      active,
      completed,
    };
  }, [isTaskAssignedToCurrentUser, tasks]);

  return { filteredTasks, taskCounts };
}
