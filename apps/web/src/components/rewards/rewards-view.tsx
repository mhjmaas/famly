"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import type { Dictionary } from "@/i18n/types";
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
import { ClaimConfirmationSheet } from "./claim-confirmation-sheet";
import { DeleteRewardDialog } from "./delete-reward-dialog";
import { EmptyState } from "./empty-state";
import { KarmaBalanceCard } from "./karma-balance-card";
import { RewardDialog } from "./reward-dialog";
import { RewardsGrid } from "./rewards-grid";

interface RewardsViewProps {
  dict: Dictionary;
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
  const [deleteConfirmReward, setDeleteConfirmReward] = useState<Reward | null>(
    null,
  );

  const t = dict.dashboard.pages.rewards;

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchRewards(familyId));
    dispatch(fetchClaims(familyId));
  }, [dispatch, familyId]);

  const handleRefresh = async () => {
    await dispatch(fetchRewards(familyId));
    await dispatch(fetchClaims(familyId));
  };

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

  const handleDialogSubmit = async (
    data: CreateRewardRequest,
    imageFile?: File,
  ) => {
    try {
      if (dialogMode === "create") {
        await dispatch(createReward({ familyId, data, imageFile })).unwrap();
        toast.success("Reward created successfully");
      } else if (editingReward) {
        await dispatch(
          updateReward({
            familyId,
            rewardId: editingReward._id,
            data,
            imageFile,
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

  const handleDeleteClick = (reward: Reward) => {
    setDeleteConfirmReward(reward);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmReward) return;

    try {
      await dispatch(
        deleteReward({ familyId, rewardId: deleteConfirmReward._id }),
      ).unwrap();
      toast.success(t.toast.deleteSuccess);
      setDeleteConfirmReward(null);
    } catch (error) {
      toast.error(
        `${t.toast.deleteError}: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6" data-testid="rewards-view">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="hidden sm:block text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground text-center sm:text-left">
              {t.description}
            </p>
          </div>
          {userRole === "parent" && (
            <Button
              onClick={handleCreateClick}
              className="hidden sm:flex gap-2"
              data-testid="create-reward-button"
            >
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

        {userRole === "parent" && (
          <Button
            onClick={handleCreateClick}
            className="w-full sm:hidden gap-2"
            data-testid="create-reward-button-mobile"
          >
            <Plus className="h-4 w-4" />
            {t.actions.createButton}
          </Button>
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

        <DeleteRewardDialog
          isOpen={!!deleteConfirmReward}
          reward={deleteConfirmReward}
          onClose={() => setDeleteConfirmReward(null)}
          onConfirm={handleDeleteConfirm}
          dict={dict}
        />
      </div>
    </PullToRefresh>
  );
}
