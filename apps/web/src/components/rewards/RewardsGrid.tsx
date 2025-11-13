import type { Dictionary } from "@/i18n/types";
import type { Claim, Reward } from "@/types/api.types";
import { RewardCard } from "./RewardCard";

interface RewardsGridProps {
  rewards: Reward[];
  claims: Claim[];
  userRole: "parent" | "child";
  userId: string;
  userKarma: number;
  onClaim: (reward: Reward) => void;
  onEdit: (reward: Reward) => void;
  onDelete: (reward: Reward) => void;
  onToggleFavourite: (reward: Reward) => void;
  onCancelClaim: (claimId: string) => void;
  dict: Dictionary;
}

export function RewardsGrid({
  rewards,
  claims,
  userRole,
  userId,
  userKarma,
  onClaim,
  onEdit,
  onDelete,
  onToggleFavourite,
  onCancelClaim,
  dict,
}: RewardsGridProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-testid="rewards-grid"
    >
      {rewards.map((reward) => {
        const isFavourited = reward.isFavourite || false;
        const pendingClaim = claims.find(
          (c) =>
            c.rewardId === reward._id &&
            c.memberId === userId &&
            c.status === "pending",
        );
        const isPending = !!pendingClaim;
        const canClaim = userKarma >= reward.karmaCost && !isPending;

        return (
          <RewardCard
            key={reward._id}
            reward={reward}
            isFavourited={isFavourited}
            isPending={isPending}
            canClaim={canClaim}
            userRole={userRole}
            userKarma={userKarma}
            onClaim={() => onClaim(reward)}
            onEdit={() => onEdit(reward)}
            onDelete={() => onDelete(reward)}
            onToggleFavourite={() => onToggleFavourite(reward)}
            onCancelClaim={
              pendingClaim ? () => onCancelClaim(pendingClaim._id) : undefined
            }
            dict={dict}
          />
        );
      })}
    </div>
  );
}
