import { KarmaCard } from "./karma-card";
import { PendingTasksCard } from "./pending-tasks-card";
import { PotentialKarmaCard } from "./potential-karma-card";

interface DashboardSummaryCardsProps {
  availableKarma: number;
  pendingTasksCount: number;
  potentialKarma: number;
  labels: {
    availableKarma: string;
    pendingTasks: string;
    potentialKarma: string;
  };
}

export function DashboardSummaryCards({
  availableKarma,
  pendingTasksCount,
  potentialKarma,
  labels,
}: DashboardSummaryCardsProps) {
  return (
    <div className="hidden gap-4 lg:grid lg:grid-cols-3">
      <KarmaCard karma={availableKarma} label={labels.availableKarma} />
      <PendingTasksCard count={pendingTasksCount} label={labels.pendingTasks} />
      <PotentialKarmaCard
        karma={potentialKarma}
        label={labels.potentialKarma}
      />
    </div>
  );
}
