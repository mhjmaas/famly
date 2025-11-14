import { logger } from "@lib/logger";
import type { KarmaService } from "@modules/karma";
import type { Task } from "@modules/tasks/domain/task";
import type { TaskCompletionHook } from "@modules/tasks/hooks/task-completion.hook";
import { ObjectId } from "mongodb";
import type { ClaimRepository } from "../repositories/claim.repository";
import type { MetadataRepository } from "../repositories/metadata.repository";
import type { RewardRepository } from "../repositories/reward.repository";

/**
 * Hook that completes reward claims when their associated auto-task is completed
 * This integrates the task completion workflow with the reward claim system
 */
export class ClaimCompletionHook implements TaskCompletionHook {
  constructor(
    private claimRepository: ClaimRepository,
    private rewardRepository: RewardRepository,
    private metadataRepository: MetadataRepository,
    private karmaService: KarmaService,
  ) {}

  async onTaskCompleted(
    task: Task,
    creditedUserId: ObjectId,
    triggeredBy: ObjectId,
  ): Promise<void> {
    // Check if this task is associated with a claim
    if (!task.metadata?.claimId) {
      return; // Not a reward claim task, nothing to do
    }

    try {
      logger.info("Processing claim completion from task", {
        taskId: task._id.toString(),
        claimId: task.metadata.claimId,
        creditedUserId: creditedUserId.toString(),
        triggeredBy: triggeredBy.toString(),
      });

      const claimId = new ObjectId(task.metadata.claimId as string);

      // Find the claim
      const claim = await this.claimRepository.findById(claimId);
      if (!claim) {
        logger.warn("Claim not found for completed task", {
          claimId: claimId.toString(),
          taskId: task._id.toString(),
        });
        return;
      }

      // If claim is already completed or cancelled, skip
      if (claim.status !== "pending") {
        logger.debug("Claim is not pending, skipping completion", {
          claimId: claimId.toString(),
          status: claim.status,
        });
        return;
      }

      // Get reward details
      const reward = await this.rewardRepository.findById(claim.rewardId);
      if (!reward) {
        logger.error("Reward not found for claim", {
          claimId: claimId.toString(),
          rewardId: claim.rewardId.toString(),
        });
        return;
      }

      // Check member still has sufficient karma
      const memberKarma = await this.karmaService.getMemberKarma(
        claim.familyId,
        claim.memberId,
        claim.memberId,
      );

      if (memberKarma.totalKarma < reward.karmaCost) {
        logger.warn("Member has insufficient karma to complete claim", {
          claimId: claimId.toString(),
          memberId: claim.memberId.toString(),
          required: reward.karmaCost,
          available: memberKarma.totalKarma,
        });
        // Don't complete the claim - it should remain pending
        return;
      }

      // Deduct karma
      await this.karmaService.deductKarma({
        familyId: claim.familyId,
        userId: claim.memberId,
        amount: reward.karmaCost,
        claimId: claimId.toString(),
        rewardName: reward.name,
      });

      // Update claim status to completed
      await this.claimRepository.updateStatus(claimId, "completed", {
        completedBy: creditedUserId,
        completedAt: new Date(),
      });

      // Increment claim count in metadata
      try {
        await this.metadataRepository.incrementClaimCount(
          claim.familyId,
          reward._id,
          claim.memberId,
        );
      } catch (error) {
        logger.error("Failed to update claim metadata, but claim completed", {
          claimId: claimId.toString(),
          error,
        });
        // Don't throw - claim completion should succeed even if metadata fails
      }

      logger.info("Claim completed successfully", {
        claimId: claimId.toString(),
        rewardId: reward._id.toString(),
        memberId: claim.memberId.toString(),
        karmaCost: reward.karmaCost,
      });
    } catch (error) {
      logger.error("Failed to complete claim from task completion", {
        taskId: task._id.toString(),
        claimId: task.metadata.claimId,
        error,
      });
      throw error;
    }
  }
}
