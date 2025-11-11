import { CheckCircle2 } from "lucide-react";

interface EmptyTasksStateProps {
  title: string;
  description: string;
}

export function EmptyTasksState({ title, description }: EmptyTasksStateProps) {
  return (
    <div className="text-center py-8" data-testid="empty-tasks-state">
      <div className="rounded-full bg-muted p-4 inline-block mb-3">
        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
