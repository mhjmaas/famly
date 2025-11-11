import { CheckCircle2 } from "lucide-react";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PendingTasksCardProps {
  count: number;
  label: string;
}

export const PendingTasksCard = memo(function PendingTasksCard({
  count,
  label,
}: PendingTasksCardProps) {
  return (
    <Card className="bg-muted/50" data-testid="dashboard-pending-tasks-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-4xl font-bold" data-testid="pending-tasks-count">
              {count}
            </p>
          </div>
          <div className="rounded-full bg-muted p-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
