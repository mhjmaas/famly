import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Dictionary } from "@/i18n/types";

type FilterType = "my-tasks" | "all" | "active" | "completed";

interface TaskCounts {
  myTasks: number;
  all: number;
  active: number;
  completed: number;
}

interface TaskFiltersProps {
  taskCounts: TaskCounts;
  dict: Dictionary;
}

function TabBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <span className="bg-muted-foreground/10 text-muted-foreground inline-flex min-w-[1.5rem] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none">
      {count}
    </span>
  );
}

export function TaskFilters({ taskCounts, dict }: TaskFiltersProps) {
  const t = dict.dashboard.pages.tasks;

  return (
    <div className="w-full flex justify-center">
      <TabsList data-testid="tasks-filters">
        <TabsTrigger value="my-tasks" data-testid="tasks-filter-my">
          {t.filters.myTasks}
          <TabBadge count={taskCounts.myTasks} />
        </TabsTrigger>
        <TabsTrigger value="all" data-testid="tasks-filter-all">
          {t.filters.all}
          <TabBadge count={taskCounts.all} />
        </TabsTrigger>
        <TabsTrigger value="active" data-testid="tasks-filter-active">
          {t.filters.active}
          <TabBadge count={taskCounts.active} />
        </TabsTrigger>
        <TabsTrigger value="completed" data-testid="tasks-filter-completed">
          {t.filters.completed}
          <TabBadge count={taskCounts.completed} />
        </TabsTrigger>
      </TabsList>
    </div>
  );
}

export type { FilterType, TaskCounts };
