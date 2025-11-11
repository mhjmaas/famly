import { Heart } from "lucide-react";

interface EmptyRewardsStateProps {
  title: string;
  description: string;
}

export function EmptyRewardsState({
  title,
  description,
}: EmptyRewardsStateProps) {
  return (
    <div className="text-center py-8" data-testid="empty-rewards-state">
      <div className="rounded-full bg-muted p-4 inline-block mb-3">
        <Heart className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-2">{title}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
