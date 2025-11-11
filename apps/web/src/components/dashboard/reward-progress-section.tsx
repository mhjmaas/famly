import { Card, CardContent } from "@/components/ui/card";
import type { Reward } from "@/types/api.types";
import { EmptyRewardsState } from "./empty-rewards-state";
import { RewardProgressCard } from "./reward-progress-card";
import { SectionHeader } from "./section-header";

interface RewardProgressSectionProps {
  rewards: Reward[];
  userKarma: number;
  lang: string;
  labels: {
    title: string;
    viewAll: string;
    emptyTitle: string;
    emptyDescription: string;
    ready: string;
    remaining: string;
  };
}

export function RewardProgressSection({
  rewards,
  userKarma,
  lang,
  labels,
}: RewardProgressSectionProps) {
  return (
    <Card data-testid="reward-progress-section">
      <SectionHeader
        title={labels.title}
        viewAllLabel={labels.viewAll}
        viewAllHref={`/${lang}/app/rewards`}
      />
      <CardContent className="space-y-4">
        {rewards.length === 0 ? (
          <EmptyRewardsState
            title={labels.emptyTitle}
            description={labels.emptyDescription}
          />
        ) : (
          rewards.map((reward) => (
            <RewardProgressCard
              key={reward._id}
              reward={reward}
              userKarma={userKarma}
              lang={lang}
              labels={{ ready: labels.ready, remaining: labels.remaining }}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
