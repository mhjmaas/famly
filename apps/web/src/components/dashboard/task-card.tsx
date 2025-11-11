"use client";

import { format } from "date-fns";
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types/api.types";

interface TaskCardProps {
  task: Task;
  lang: string;
  onToggleComplete?: (task: Task) => void;
}

export function TaskCard({ task, lang, onToggleComplete }: TaskCardProps) {
  const handleCheckboxChange = () => {
    if (onToggleComplete) {
      onToggleComplete(task);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors ${
        task.completedAt ? "opacity-60" : ""
      }`}
      data-testid="task-card"
    >
      {onToggleComplete && (
        <Checkbox
          checked={!!task.completedAt}
          onCheckedChange={handleCheckboxChange}
          data-testid="task-complete-toggle"
          className="flex-shrink-0"
        />
      )}
      <Link href={`/${lang}/app/tasks`} className="flex-1 min-w-0 block">
        <h4
          className={`font-medium mb-1 ${
            task.completedAt ? "line-through text-muted-foreground" : ""
          }`}
          data-testid="task-name"
        >
          {task.name}
        </h4>
        {task.description && (
          <p
            className="text-sm text-muted-foreground mb-2"
            data-testid="task-description"
          >
            {task.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {task.dueDate && (
            <Badge
              variant="outline"
              className="gap-1"
              data-testid="task-due-date"
            >
              <Clock className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </Badge>
          )}
          {task.metadata?.karma && (
            <Badge
              variant="default"
              className={`gap-1 ${task.completedAt ? "opacity-60" : ""}`}
              data-testid="task-karma"
            >
              <Sparkles className="h-3 w-3 fill-current" />
              {task.metadata.karma} Karma
            </Badge>
          )}
        </div>
      </Link>
    </div>
  );
}
