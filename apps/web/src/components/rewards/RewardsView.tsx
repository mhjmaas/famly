"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cancelClaim,
  claimReward,
  fetchClaims,
  selectClaims,
} from "@/store/slices/claims.slice";
import {
  createReward,
  deleteReward,
  fetchRewards,
  selectRewards,
  selectRewardsLoading,
  toggleFavourite,
  updateReward,
} from "@/store/slices/rewards.slice";
import type { CreateRewardRequest, Reward } from "@/types/api.types";
import { ClaimConfirmationSheet } from "./ClaimConfirmationSheet";
import { EmptyState } from "./EmptyState";
import { KarmaBalanceCard } from "./KarmaBalanceCard";
import { RewardDialog } from "./RewardDialog";
import { RewardsGrid } from "./RewardsGrid";

interface RewardsViewProps {
  dict: any;
  familyId: string;
  userId: string;
  userRole: "parent" | "child";
  userKarma: number;
}

export function RewardsView({
  dict,
  familyId,
  userId,
  userRole,
  userKarma,
}: RewardsViewProps) {
  const dispatch = useAppDispatch();
  const rewards = useAppSelector(selectRewards);
  const claims = useAppSelector(selectClaims);
  const isLoading = useAppSelector(selectRewardsLoading);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingReward, setEditingReward] = useState<Reward | undefined>();
  const [claimSheetOpen, setClaimSheetOpen] = useState(false);
  const [claimingReward, setClaimingReward] = useState<Reward | null>(null);

  const t = dict.dashboard.pages.rewards;

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchRewards(familyId));
    dispatch(fetchClaims(familyId));
  }, [dispatch, familyId]);

  const handleCreateClick = () => {
    setDialogMode("create");
    setEditingReward(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (reward: Reward) => {
    setDialogMode("edit");
    setEditingReward(reward);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (data: CreateRewardRequest) => {
    try {
      if (dialogMode === "create") {
        await dispatch(createReward({ familyId, data })).unwrap();
        toast.success("Reward created successfully");
      } else if (editingReward) {
        await dispatch(
          updateReward({
            familyId,
            rewardId: editingReward._id,
            data,
          }),
        ).unwrap();
        toast.success("Reward updated successfully");
      }
    } catch (error) {
      toast.error(
        `Failed to ${dialogMode} reward: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDeleteClick = async (reward: Reward) => {
    if (!confirm(`Are you sure you want to delete "${reward.name}"?`)) {
      return;
    }

    try {
      await dispatch(deleteReward({ familyId, rewardId: reward._id })).unwrap();
      toast.success("Reward deleted successfully");
    } catch (error) {
      toast.error(
        `Failed to delete reward: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleClaimClick = (reward: Reward) => {
    setClaimingReward(reward);
    setClaimSheetOpen(true);
  };

  const handleClaimConfirm = async () => {
    if (!claimingReward) return;

    try {
      await dispatch(
        claimReward({ familyId, rewardId: claimingReward._id }),
      ).unwrap();
      toast.success(
        dict.dashboard.pages.rewards.toast.success.replace(
          "{name}",
          claimingReward.name,
        ),
      );
      setClaimSheetOpen(false);
      setClaimingReward(null);
    } catch (error) {
      toast.error(
        `Failed to claim reward: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleToggleFavourite = async (reward: Reward) => {
    const newFavouriteStatus = !reward.isFavourite;

    try {
      await dispatch(
        toggleFavourite({
          familyId,
          rewardId: reward._id,
          isFavourite: newFavouriteStatus,
        }),
      ).unwrap();
    } catch (error) {
      toast.error(
        `Failed to update favourite: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    try {
      await dispatch(cancelClaim({ familyId, claimId })).unwrap();
      toast.success(dict.dashboard.pages.rewards.toast.cancelled);
    } catch (error) {
      toast.error(
        `${dict.dashboard.pages.rewards.toast.cancelError}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading && rewards.length === 0) {
    return <div className="text-center py-12">{t.loading}</div>;
  }

  return (
    <div className="space-y-6" data-testid="rewards-view">
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        {userRole === "parent" && (
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            {t.actions.createButton}
          </Button>
        )}
      </div>

      <KarmaBalanceCard karma={userKarma} dict={dict} />

      {rewards.length === 0 ? (
        <EmptyState
          userRole={userRole}
          onCreateClick={handleCreateClick}
          dict={dict}
        />
      ) : (
        <RewardsGrid
          rewards={rewards}
          claims={claims}
          userRole={userRole}
          userId={userId}
          userKarma={userKarma}
          onClaim={handleClaimClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onToggleFavourite={handleToggleFavourite}
          onCancelClaim={handleCancelClaim}
          dict={dict}
        />
      )}

      <RewardDialog
        isOpen={dialogOpen}
        mode={dialogMode}
        reward={editingReward}
        onSubmit={handleDialogSubmit}
        onClose={() => setDialogOpen(false)}
        dict={dict}
      />

      <ClaimConfirmationSheet
        reward={claimingReward}
        isOpen={claimSheetOpen}
        onConfirm={handleClaimConfirm}
        onCancel={() => {
          setClaimSheetOpen(false);
          setClaimingReward(null);
        }}
        dict={dict}
      />
    </div>
  );
}
