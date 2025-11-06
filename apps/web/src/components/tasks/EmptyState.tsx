import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FilterType } from "./TaskFilters";

interface EmptyStateProps {
  filter: FilterType;
  onCreateTask: () => void;
  dict: any;
}

export function EmptyState({ filter, onCreateTask, dict }: EmptyStateProps) {
  const t = dict.dashboard.pages.tasks;

  return (
    <Card className="border-2 border-dashed" data-testid="tasks-empty">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div
          className="rounded-full bg-muted p-4 mb-4"
          data-testid="tasks-empty-icon"
        >
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3
          className="text-lg font-semibold mb-2"
          data-testid="tasks-empty-title"
        >
          {t.emptyState.title}
        </h3>
        <p
          className="text-muted-foreground text-center mb-4"
          data-testid="tasks-empty-description"
        >
          {filter === "my-tasks" ? t.emptyState.myTasks : t.emptyState.default}
        </p>
        <Button
          onClick={onCreateTask}
          className="gap-2"
          data-testid="tasks-empty-create"
        >
          <Plus className="h-4 w-4" />
          {t.emptyState.cta}
        </Button>
      </CardContent>
    </Card>
  );
}
