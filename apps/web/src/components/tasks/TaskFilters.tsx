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
      <TabsList
        className="inline-flex items-center rounded-full bg-muted/60 p-1 shadow-sm gap-1"
        data-testid="tasks-filters"
      >
        <TabsTrigger
          value="my-tasks"
          className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          data-testid="tasks-filter-my"
        >
          {t.filters.myTasks}
          <TabBadge count={taskCounts.myTasks} />
        </TabsTrigger>
        <TabsTrigger
          value="all"
          className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          data-testid="tasks-filter-all"
        >
          {t.filters.all}
          <TabBadge count={taskCounts.all} />
        </TabsTrigger>
        <TabsTrigger
          value="active"
          className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          data-testid="tasks-filter-active"
        >
          {t.filters.active}
          <TabBadge count={taskCounts.active} />
        </TabsTrigger>
        <TabsTrigger
          value="completed"
          className="rounded-full px-4 py-1.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          data-testid="tasks-filter-completed"
        >
          {t.filters.completed}
          <TabBadge count={taskCounts.completed} />
        </TabsTrigger>
      </TabsList>
    </div>
  );
}

export type { FilterType, TaskCounts };
