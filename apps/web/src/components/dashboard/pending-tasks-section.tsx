import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@/types/api.types";
import { EmptyTasksState } from "./empty-tasks-state";
import { SectionHeader } from "./section-header";
import { TaskCard } from "./task-card";

interface PendingTasksSectionProps {
  tasks: Task[];
  lang: string;
  labels: {
    title: string;
    viewAll: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  onToggleComplete?: (task: Task) => void;
}

export function PendingTasksSection({
  tasks,
  lang,
  labels,
  onToggleComplete,
}: PendingTasksSectionProps) {
  return (
    <Card data-testid="pending-tasks-section">
      <SectionHeader
        title={labels.title}
        viewAllLabel={labels.viewAll}
        viewAllHref={`/${lang}/app/tasks`}
      />
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <EmptyTasksState
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              lang={lang}
              onToggleComplete={onToggleComplete}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
