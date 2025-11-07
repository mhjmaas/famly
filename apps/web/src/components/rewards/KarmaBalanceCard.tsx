import { Award, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface KarmaBalanceCardProps {
  karma: number;
  dict: any;
}

export function KarmaBalanceCard({ karma, dict }: KarmaBalanceCardProps) {
  const t = dict.dashboard.pages.rewards.karmaBalance;

  return (
    <Card className="bg-muted/50" data-testid="karma-balance-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary fill-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.title}</p>
              <p className="text-3xl font-bold text-primary">{karma}</p>
            </div>
          </div>
          <Award className="h-12 w-12 text-primary/20" />
        </div>
      </CardContent>
    </Card>
  );
}
