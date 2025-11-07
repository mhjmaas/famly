import {
  Award,
  Clock,
  Edit,
  Gift,
  Heart,
  MoreVertical,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Reward } from "@/types/api.types";
import { CancelClaimButton } from "./CancelClaimButton";

interface RewardCardProps {
  reward: Reward;
  isFavourited: boolean;
  isPending: boolean;
  canClaim: boolean;
  userRole: "parent" | "child";
  userKarma: number;
  onClaim: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavourite: () => void;
  onCancelClaim?: () => Promise<void> | void;
  dict: any;
}

export function RewardCard({
  reward,
  isFavourited,
  isPending,
  canClaim,
  userRole,
  userKarma,
  onClaim,
  onEdit,
  onDelete,
  onToggleFavourite,
  onCancelClaim,
  dict,
}: RewardCardProps) {
  const t = dict.dashboard.pages.rewards.card;
  const cancelCopy = {
    label: t.cancel,
    ...t.cancelConfirm,
  };

  // Calculate progress for favourited rewards
  const progress = isFavourited
    ? Math.min((userKarma / reward.karmaCost) * 100, 100)
    : 0;

  // Determine image URL with fallback
  const imageUrl =
    reward.imageUrl ||
    `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(reward.name)}`;

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow"
      data-testid="reward-card"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={reward.name}
          className="object-cover w-full h-full"
        />
        <div className="absolute top-2 left-2 right-2 flex justify-between">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-background/90 backdrop-blur"
            onClick={onToggleFavourite}
            data-testid="reward-favourite-button"
            aria-label={isFavourited ? t.unfavourite : t.favourite}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavourited
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground",
              )}
            />
          </Button>
          <div className="flex gap-2">
            <Badge
              variant="secondary"
              className="gap-1 bg-background/90 backdrop-blur"
            >
              <Sparkles className="h-3 w-3 fill-primary text-primary" />
              {reward.karmaCost}
            </Badge>
            {userRole === "parent" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-background/90 backdrop-blur"
                    data-testid="reward-actions-button"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit} className="gap-2">
                    <Edit className="h-4 w-4" />
                    {t.edit}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg mb-1">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-muted-foreground">
              {reward.description}
            </p>
          )}
        </div>
        {isFavourited && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t.progress.saving}</span>
              <span className="font-medium">
                {userKarma} / {reward.karmaCost}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress >= 100 ? (
              <p className="text-xs text-green-600 font-medium">
                {t.progress.complete}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {t.progress.needed.replace(
                  "{amount}",
                  String(reward.karmaCost - userKarma),
                )}
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="h-4 w-4" />
            <span>
              {t.claimCount.replace("{count}", String(reward.claimCount || 0))}
            </span>
          </div>
          {isPending ? (
            <div className="flex items-center gap-2">
              {onCancelClaim && (
                <CancelClaimButton
                  copy={cancelCopy}
                  onConfirm={onCancelClaim}
                />
              )}
              <Button
                size="sm"
                disabled
                className="gap-2"
                data-testid="reward-claim-button"
              >
                <Clock className="h-4 w-4" />
                {t.pendingButton}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={onClaim}
              disabled={!canClaim}
              className="gap-2"
              data-testid="reward-claim-button"
            >
              <Gift className="h-4 w-4" />
              {canClaim ? t.claimButton : t.insufficientKarma}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
