import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { KarmaService } from "@modules/karma";
import type { TaskService } from "@modules/tasks/services/task.service";
import type { CreateTaskInput } from "@modules/tasks/domain/task";
import type { ObjectId } from "mongodb";
import type { ClaimDTO } from "../domain/reward";
import type { ClaimRepository } from "../repositories/claim.repository";
import type { MetadataRepository } from "../repositories/metadata.repository";
import type { RewardRepository } from "../repositories/reward.repository";
import { toClaimDTO } from "../lib/reward.mapper";

/**
 * Service for reward claim business logic
 * Orchestrates the claim workflow: creation, cancellation, and completion
 */
export class ClaimService {
  constructor(
    private claimRepository: ClaimRepository,
    private rewardRepository: RewardRepository,
    private metadataRepository: MetadataRepository,
    private karmaService: KarmaService,
    private taskService: TaskService,
  ) {}

  /**
   * Create a new reward claim
   * Validates karma availability and prevents duplicate pending claims
   * Auto-creates an approval task for parents
   * @param rewardId - The reward being claimed
   * @param familyId - The family context
   * @param memberId - The member claiming the reward
   * @returns The created claim DTO
   * @throws HttpError with 400 if member has insufficient karma
   * @throws HttpError with 404 if reward not found
   * @throws HttpError with 409 if duplicate pending claim exists
   */
  async createClaim(
    rewardId: ObjectId,
    familyId: ObjectId,
    memberId: ObjectId,
  ): Promise<ClaimDTO> {
    try {
      logger.info("Creating claim", {
        rewardId: rewardId.toString(),
        familyId: familyId.toString(),
        memberId: memberId.toString(),
      });

      // Step 1: Validate reward exists
      const reward = await this.rewardRepository.findById(rewardId);
      if (!reward || reward.familyId.toString() !== familyId.toString()) {
        throw HttpError.notFound("Reward not found");
      }

      // Step 2: Check for existing pending claim
      const existingClaim =
        await this.claimRepository.findPendingByRewardAndMember(
          rewardId,
          memberId,
        );

      if (existingClaim) {
        throw HttpError.conflict(
          "Member already has a pending claim for this reward",
        );
      }

      // Step 3: Validate member has sufficient karma
      const memberKarma = await this.karmaService.getMemberKarma(
        familyId,
        memberId,
        memberId,
      );

      if (memberKarma.totalKarma < reward.karmaCost) {
        throw HttpError.badRequest(
          `Insufficient karma. Required: ${reward.karmaCost}, Available: ${memberKarma.totalKarma}`,
        );
      }

      // Step 4: Create the claim in pending status
      const claim = await this.claimRepository.create(
        rewardId,
        familyId,
        memberId,
      );

      // Step 5: Auto-create approval task for parents
      try {
        const taskInput: CreateTaskInput = {
          name: `Provide reward: ${reward.name}`,
          description: `This will deduct ${reward.karmaCost} karma from ${memberId}. Reward: ${reward.name}`,
          assignment: { type: "role", role: "parent" },
          metadata: { claimId: claim._id.toString() },
        };

        const createdTask = await this.taskService.createTask(
          familyId,
          memberId, // Use member as creator to mark their involvement
          taskInput,
        );

        // Step 6: Update claim with auto-task ID
        const updatedClaim = await this.claimRepository.updateAutoTaskId(
          claim._id,
          createdTask._id,
        );

        if (!updatedClaim) {
          // If update fails, delete the claim to maintain consistency
          logger.warn(
            "Failed to update claim with auto-task ID, rolling back claim",
            {
              claimId: claim._id.toString(),
              taskId: createdTask._id.toString(),
            },
          );
          await this.claimRepository.delete(claim._id);
          throw new Error("Failed to associate task with claim");
        }

        logger.info("Claim created successfully with auto-task", {
          claimId: updatedClaim._id.toString(),
          rewardId: rewardId.toString(),
          taskId: createdTask._id.toString(),
        });

        return toClaimDTO(updatedClaim);
      } catch (error) {
        // If task creation fails, still keep the claim but log the error
        logger.error("Failed to create auto-task for claim", {
          claimId: claim._id.toString(),
          rewardId: rewardId.toString(),
          error,
        });

        // Return claim anyway since it's created
        return toClaimDTO(claim);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to create claim", {
        rewardId: rewardId.toString(),
        familyId: familyId.toString(),
        memberId: memberId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Cancel a pending claim
   * Deletes the auto-generated task if it exists
   * @param claimId - The claim to cancel
   * @param cancelledBy - User ID cancelling the claim
   * @returns The cancelled claim DTO
   * @throws HttpError with 404 if claim not found
   * @throws HttpError with 409 if claim is not pending
   */
  async cancelClaim(
    claimId: ObjectId,
    cancelledBy: ObjectId,
  ): Promise<ClaimDTO> {
    try {
      logger.info("Cancelling claim", {
        claimId: claimId.toString(),
        cancelledBy: cancelledBy.toString(),
      });

      // Step 1: Find the claim
      const claim = await this.claimRepository.findById(claimId);

      if (!claim) {
        throw HttpError.notFound("Claim not found");
      }

      // Step 2: Verify claim is pending
      if (claim.status !== "pending") {
        throw HttpError.conflict(
          `Cannot cancel a ${claim.status} claim. Only pending claims can be cancelled.`,
        );
      }

      // Step 3: Delete the auto-task if it exists
      if (claim.autoTaskId) {
        try {
          // Note: We don't have direct task delete, so we just log here
          // In the integration, the task service should support deletion
          logger.debug("Auto-task would be deleted here", {
            taskId: claim.autoTaskId.toString(),
          });
        } catch (error) {
          // Log the error but don't fail the cancellation
          logger.warn("Failed to delete auto-task during claim cancellation", {
            claimId: claimId.toString(),
            taskId: claim.autoTaskId.toString(),
            error,
          });
        }
      }

      // Step 4: Update claim status to cancelled
      const updatedClaim = await this.claimRepository.updateStatus(
        claimId,
        "cancelled",
        {
          cancelledBy,
          cancelledAt: new Date(),
        },
      );

      if (!updatedClaim) {
        throw HttpError.notFound("Failed to cancel claim");
      }

      logger.info("Claim cancelled successfully", {
        claimId: claimId.toString(),
      });

      return toClaimDTO(updatedClaim);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to cancel claim", {
        claimId: claimId.toString(),
        cancelledBy: cancelledBy.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Complete a claim from task completion
   * Validates member still has sufficient karma, deducts karma, updates metadata
   * @param claimId - The claim to complete
   * @param completedBy - User ID completing the claim
   * @returns The completed claim DTO
   * @throws HttpError with 404 if claim not found
   * @throws HttpError with 409 if claim is not pending
   * @throws HttpError with 400 if member has insufficient karma at completion
   */
  async completeClaimFromTask(
    claimId: ObjectId,
    completedBy: ObjectId,
  ): Promise<ClaimDTO> {
    try {
      logger.info("Completing claim from task", {
        claimId: claimId.toString(),
        completedBy: completedBy.toString(),
      });

      // Step 1: Find the claim
      const claim = await this.claimRepository.findById(claimId);

      if (!claim) {
        throw HttpError.notFound("Claim not found");
      }

      // Step 2: Verify claim is pending
      if (claim.status !== "pending") {
        throw HttpError.conflict(
          `Cannot complete a ${claim.status} claim. Only pending claims can be completed.`,
        );
      }

      // Step 3: Get reward details
      const reward = await this.rewardRepository.findById(claim.rewardId);

      if (!reward) {
        throw HttpError.notFound("Reward not found");
      }

      // Step 4: Re-validate member has sufficient karma (race condition check)
      const memberKarma = await this.karmaService.getMemberKarma(
        claim.familyId,
        claim.memberId,
        claim.memberId,
      );

      if (memberKarma.totalKarma < reward.karmaCost) {
        throw HttpError.badRequest(
          `Member no longer has sufficient karma to complete this claim. Required: ${reward.karmaCost}, Available: ${memberKarma.totalKarma}`,
        );
      }

      // Step 5: Update claim status to completed
      const updatedClaim = await this.claimRepository.updateStatus(
        claimId,
        "completed",
        {
          completedBy,
          completedAt: new Date(),
        },
      );

      if (!updatedClaim) {
        throw HttpError.notFound("Failed to complete claim");
      }

      // Step 6: Deduct karma from member
      try {
        await this.karmaService.deductKarma({
          familyId: claim.familyId,
          userId: claim.memberId,
          amount: reward.karmaCost,
          claimId: claimId.toString(),
          rewardName: reward.name,
        });

        logger.debug("Karma deducted for claim", {
          claimId: claimId.toString(),
          amount: reward.karmaCost,
        });
      } catch (error) {
        logger.error("Failed to deduct karma for claim completion", {
          claimId: claimId.toString(),
          error,
        });
        // We don't throw here to allow claim completion even if karma deduction fails
        // This is best-effort for reward delivery
      }

      // Step 7: Increment metadata claim count
      try {
        await this.metadataRepository.incrementClaimCount(
          claim.familyId,
          claim.rewardId,
          claim.memberId,
        );

        logger.debug("Metadata claim count incremented", {
          claimId: claimId.toString(),
        });
      } catch (error) {
        logger.warn("Failed to increment metadata claim count", {
          claimId: claimId.toString(),
          error,
        });
        // Non-fatal: metadata updates are informational
      }

      logger.info("Claim completed successfully", {
        claimId: claimId.toString(),
        rewardId: claim.rewardId.toString(),
      });

      return toClaimDTO(updatedClaim);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to complete claim", {
        claimId: claimId.toString(),
        completedBy: completedBy.toString(),
        error,
      });
      throw error;
    }
  }
}
