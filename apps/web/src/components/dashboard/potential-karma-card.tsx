import { Sparkles } from "lucide-react";
import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface PotentialKarmaCardProps {
  karma: number;
  label: string;
}

export const PotentialKarmaCard = memo(function PotentialKarmaCard({
  karma,
  label,
}: PotentialKarmaCardProps) {
  return (
    <Card className="bg-muted/50" data-testid="dashboard-potential-karma-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p
              className="text-4xl font-bold text-green-600"
              data-testid="potential-karma-amount"
            >
              {karma}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-4">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
