import { format, isSameDay, isToday, isYesterday, startOfDay } from "date-fns";
import { useMemo } from "react";
import type { FilterType } from "@/components/tasks/TaskFilters";
import type { Task } from "@/types/api.types";

interface TaskGroup {
  date: Date | null;
  tasks: Task[];
}

interface UseTaskGroupsParams {
  tasks: Task[];
  filter: FilterType;
}

export function useTaskGroups({ tasks, filter }: UseTaskGroupsParams) {
  const groupTasksByCompletionDate = (tasks: Task[]): TaskGroup[] => {
    const groups: TaskGroup[] = [];

    const completedTasks = tasks
      .filter((t) => t.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime(),
      );

    const activeTasks = tasks.filter((t) => !t.completedAt);

    if (activeTasks.length > 0) {
      groups.push({ date: null, tasks: activeTasks });
    }

    completedTasks.forEach((task) => {
      if (!task.completedAt) return;
      const taskDate = startOfDay(new Date(task.completedAt));
      const existingGroup = groups.find(
        (g) => g.date && isSameDay(g.date, taskDate),
      );

      if (existingGroup) {
        existingGroup.tasks.push(task);
      } else {
        groups.push({ date: taskDate, tasks: [task] });
      }
    });

    return groups;
  };

  const formatDateSeparator = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  const shouldShowDateSeparators = filter !== "active";

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const taskGroups = useMemo(() => {
    return shouldShowDateSeparators
      ? groupTasksByCompletionDate(tasks)
      : [{ date: null, tasks }];
  }, [tasks, shouldShowDateSeparators]);

  return {
    taskGroups,
    formatDateSeparator,
    shouldShowDateSeparators,
  };
}

export type { TaskGroup };
