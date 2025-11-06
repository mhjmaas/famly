import { Edit, MoreVertical, Repeat, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@/types/api.types";

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onClaim: (task: Task) => void;
  isClaimable: (task: Task) => boolean;
  getAssignmentDisplay: (task: Task) => React.ReactNode;
  getDueDateDisplay: (task: Task) => React.ReactNode;
  dict: any;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onClaim,
  isClaimable,
  getAssignmentDisplay,
  getDueDateDisplay,
  dict,
}: TaskCardProps) {
  const t = dict.dashboard.pages.tasks;

  return (
    <Card
      className={task.completedAt ? "opacity-60" : ""}
      data-testid="task-card"
    >
      <CardContent className="p-4" data-testid="task-card-body">
        <div className="flex items-center gap-4">
          <Checkbox
            checked={!!task.completedAt}
            onCheckedChange={() => onToggleComplete(task)}
            data-testid="task-complete-toggle"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold mb-1 ${
                    task.completedAt ? "line-through text-muted-foreground" : ""
                  }`}
                  data-testid="task-name"
                >
                  {task.name}
                </h3>
                {task.description && (
                  <p
                    className="text-sm text-muted-foreground mb-2"
                    data-testid="task-description"
                  >
                    {task.description}
                  </p>
                )}
                <div
                  className="flex flex-wrap items-center gap-2"
                  data-testid="task-meta"
                >
                  {isClaimable(task) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onClaim(task)}
                      className="gap-1.5 h-7 text-xs font-medium border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                      data-testid="task-claim-button"
                    >
                      <User className="h-3 w-3" />
                      {t.claim.button}
                    </Button>
                  ) : (
                    getAssignmentDisplay(task)
                  )}
                  {getDueDateDisplay(task)}
                  {task.scheduleId && (
                    <Badge
                      variant="outline"
                      className="gap-1 h-7"
                      data-testid="task-recurring-badge"
                    >
                      <Repeat className="h-3 w-3" />
                      {t.badges.recurring}
                    </Badge>
                  )}
                </div>
              </div>
              <div
                className="flex items-center gap-3"
                data-testid="task-actions"
              >
                {task.metadata?.karma && (
                  <div
                    className="flex items-center gap-2 text-base font-semibold"
                    data-testid="task-karma"
                  >
                    <span
                      className={`h-5 w-5 ${
                        task.completedAt
                          ? "text-muted-foreground"
                          : "text-primary fill-current"
                      }`}
                    >
                      ✨
                    </span>
                    <span
                      className={
                        task.completedAt
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }
                    >
                      {task.metadata.karma}
                    </span>
                  </div>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      data-testid="task-actions-button"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    data-testid="task-actions-menu"
                  >
                    <DropdownMenuItem
                      onClick={() => onEdit(task)}
                      className="gap-2"
                      data-testid="task-action-edit"
                    >
                      <Edit className="h-4 w-4" />
                      {t.menu.edit}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(task)}
                      className="gap-2 text-destructive"
                      data-testid="task-action-delete"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t.menu.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
