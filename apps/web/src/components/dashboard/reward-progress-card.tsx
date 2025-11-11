"use client";

import { Heart, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import type { Reward } from "@/types/api.types";

interface RewardProgressCardProps {
  reward: Reward;
  userKarma: number;
  lang: string;
  labels: {
    ready: string;
    remaining: string;
  };
}

export function RewardProgressCard({
  reward,
  userKarma,
  lang,
  labels,
}: RewardProgressCardProps) {
  const progress = Math.min((userKarma / reward.karmaCost) * 100, 100);
  const remaining = Math.max(0, reward.karmaCost - userKarma);

  return (
    <Link href={`/${lang}/app/rewards`} className="block">
      <div
        className="space-y-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
        data-testid="reward-progress-card"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
            {reward.imageUrl ? (
              <Image
                src={reward.imageUrl}
                alt={reward.name}
                fill
                className="object-cover"
                data-testid="reward-image"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium" data-testid="reward-name">
                {reward.name}
              </h4>
              <Heart className="h-4 w-4 text-red-500 fill-red-500 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-3 w-3 text-primary fill-primary" />
              <span className="font-medium" data-testid="reward-karma-progress">
                {userKarma} / {reward.karmaCost}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <Progress
            value={progress}
            className="h-2"
            data-testid="reward-progress-bar"
          />
          {progress >= 100 ? (
            <p
              className="text-xs text-green-600 font-medium"
              data-testid="reward-ready"
            >
              {labels.ready}
            </p>
          ) : (
            <p
              className="text-xs text-muted-foreground"
              data-testid="reward-remaining"
            >
              {labels.remaining.replace("{count}", remaining.toString())}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
