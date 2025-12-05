import { Sparkles } from "lucide-react";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface KarmaCardProps {
  karma: number;
  label: string;
  testIdSuffix?: string;
}

export const KarmaCard = memo(function KarmaCard({
  karma,
  label,
  testIdSuffix = "",
}: KarmaCardProps) {
  const testId = testIdSuffix
    ? `dashboard-karma-card-${testIdSuffix}`
    : "dashboard-karma-card";
  return (
    <Card className="bg-muted/50" data-testid={testId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p
              className="text-4xl font-bold text-primary"
              data-testid="karma-amount"
            >
              {karma}
            </p>
          </div>
          <div className="rounded-full bg-primary/10 p-4">
            <Sparkles className="h-8 w-8 text-primary fill-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
