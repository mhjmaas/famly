import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Dictionary } from "@/i18n/types";
import type { Reward } from "@/types/api.types";
import { RewardImage } from "./RewardImage";

interface ClaimConfirmationSheetProps {
  reward: Reward | null;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  dict: Dictionary;
}

export function ClaimConfirmationSheet({
  reward,
  isOpen,
  onConfirm,
  onCancel,
  dict,
}: ClaimConfirmationSheetProps) {
  const t = dict.dashboard.pages.rewards.claimSheet;

  if (!reward) return null;

  const imageUrl =
    reward.imageUrl ||
    `/placeholder.svg?height=200&width=300&query=${encodeURIComponent(reward.name)}`;

  return (
    <Sheet open={isOpen} onOpenChange={onCancel}>
      <SheetContent className="flex flex-col" data-testid="claim-sheet">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-6 space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
              <RewardImage imageUrl={imageUrl} name={reward.name} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{reward.name}</h3>
              {reward.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {reward.description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">{t.cost}</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary fill-primary" />
                <span className="font-semibold">{reward.karmaCost} Karma</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <h4 className="font-medium text-sm">{t.whatHappensNext.title}</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>
                {t.whatHappensNext.step1.replace(
                  "{amount}",
                  String(reward.karmaCost),
                )}
              </li>
              <li>{t.whatHappensNext.step2}</li>
              <li>{t.whatHappensNext.step3}</li>
              <li>{t.whatHappensNext.step4}</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onCancel}>
            {t.actions.cancel}
          </Button>
          <Button onClick={onConfirm} data-testid="claim-confirm-button">
            {t.actions.confirm}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
