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
  const taskGroups = useMemo(() => {
    const shouldShowDateSeparators = filter !== "active";
    if (!shouldShowDateSeparators) {
      return [{ date: null, tasks }];
    }
    return groupTasksByCompletionDate(tasks);
  }, [filter, tasks]);

  const formatDateSeparator = (date: Date): string => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  return {
    taskGroups,
    formatDateSeparator,
    shouldShowDateSeparators: filter !== "active",
  };
}

export type { TaskGroup };

function groupTasksByCompletionDate(tasks: Task[]): TaskGroup[] {
  const groups: TaskGroup[] = [];

  const completedTasks = tasks
    .filter(
      (task): task is Task & { completedAt: string } => !!task.completedAt,
    )
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );

  const activeTasks = tasks.filter((t) => !t.completedAt);

  if (activeTasks.length > 0) {
    groups.push({ date: null, tasks: activeTasks });
  }

  completedTasks.forEach((task) => {
    const taskDate = startOfDay(new Date(task.completedAt));
    const existingGroup = groups.find(
      (group) => group.date && isSameDay(group.date, taskDate),
    );

    if (existingGroup) {
      existingGroup.tasks.push(task);
    } else {
      groups.push({ date: taskDate, tasks: [task] });
    }
  });

  return groups;
}
