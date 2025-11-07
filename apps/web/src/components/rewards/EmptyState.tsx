import { Gift, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  userRole: "parent" | "child";
  onCreateClick: () => void;
  dict: any;
}

export function EmptyState({ userRole, onCreateClick, dict }: EmptyStateProps) {
  const t = dict.dashboard.pages.rewards;

  return (
    <Card className="border-2 border-dashed" data-testid="rewards-empty">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t.emptyState.title}</h3>
        <p className="text-muted-foreground text-center mb-4">
          {userRole === "parent"
            ? t.emptyState.parentDescription
            : t.emptyState.childDescription}
        </p>
        {userRole === "parent" && (
          <Button
            onClick={onCreateClick}
            className="gap-2"
            data-testid="empty-state-create-button"
          >
            <Plus className="h-4 w-4" />
            {t.emptyState.createButton}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
