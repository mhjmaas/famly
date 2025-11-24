import { getDb } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  fromObjectId,
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
import { getUserLanguage, getUserName } from "@lib/user-utils";
import type { ActivityEventService } from "@modules/activity-events";
import type { KarmaService } from "@modules/karma";
import {
  createRewardClaimNotification,
  sendToUser,
} from "@modules/notifications";
import type { CreateTaskInput } from "@modules/tasks/domain/task";
import type { TaskService } from "@modules/tasks/services/task.service";
import type { ObjectId } from "mongodb";
import type { ClaimDTO } from "../domain/reward";
import {
  emitApprovalTaskCreated,
  emitClaimCancelled,
  emitClaimCompleted,
  emitClaimCreated,
} from "../events/reward-events";
import { toClaimDTO } from "../lib/reward.mapper";
import type { ClaimRepository } from "../repositories/claim.repository";
import type { MetadataRepository } from "../repositories/metadata.repository";
import type { RewardRepository } from "../repositories/reward.repository";

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
    private activityEventService?: ActivityEventService,
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
    rewardId: string,
    familyId: string,
    memberId: string,
  ): Promise<ClaimDTO> {
    let normalizedRewardId: ObjectIdString | undefined;
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedMemberId: ObjectIdString | undefined;
    try {
      normalizedRewardId = validateObjectId(rewardId, "rewardId");
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedMemberId = validateObjectId(memberId, "memberId");

      const rewardObjectId = toObjectId(normalizedRewardId, "rewardId");
      const familyObjectId = toObjectId(normalizedFamilyId, "familyId");
      const memberObjectId = toObjectId(normalizedMemberId, "memberId");

      logger.info("Creating claim", {
        rewardId: normalizedRewardId,
        familyId: normalizedFamilyId,
        memberId: normalizedMemberId,
      });

      const reward = await this.rewardRepository.findById(rewardObjectId);
      if (!reward || reward.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.notFound("Reward not found");
      }

      const existingClaim =
        await this.claimRepository.findPendingByRewardAndMember(
          rewardObjectId,
          memberObjectId,
        );

      if (existingClaim) {
        throw HttpError.conflict(
          "Member already has a pending claim for this reward",
        );
      }

      const memberKarma = await this.karmaService.getMemberKarma(
        normalizedFamilyId,
        normalizedMemberId,
        normalizedMemberId,
      );

      if (memberKarma.totalKarma < reward.karmaCost) {
        throw HttpError.badRequest(
          `Insufficient karma. Required: ${reward.karmaCost}, Available: ${memberKarma.totalKarma}`,
        );
      }

      const claim = await this.claimRepository.create(
        rewardObjectId,
        familyObjectId,
        memberObjectId,
      );

      try {
        const db = getDb();
        const usersCollection = db.collection("user");
        const user = await usersCollection.findOne({
          _id: { $eq: memberObjectId },
        });
        const memberName = user?.name || "Unknown member";

        const taskInput: CreateTaskInput = {
          name: `Provide reward: ${reward.name} for ${memberName}`,
          description: `This will deduct ${reward.karmaCost} karma points. Reward: ${reward.name}`,
          assignment: { type: "role", role: "parent" },
          metadata: { claimId: claim._id.toString() },
        };

        const createdTask = await this.taskService.createTask(
          normalizedFamilyId,
          normalizedMemberId,
          taskInput,
        );

        const updatedClaim = await this.claimRepository.updateAutoTaskId(
          claim._id,
          createdTask._id,
        );

        if (!updatedClaim) {
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
          rewardId: normalizedRewardId,
          taskId: createdTask._id.toString(),
        });

        if (this.activityEventService) {
          try {
            await this.activityEventService.recordEvent({
              userId: normalizedMemberId,
              type: "REWARD",
              title: reward.name,
              description: `Claimed reward for ${reward.karmaCost} karma`,
              detail: "CLAIMED",
              metadata: { karma: -reward.karmaCost },
              templateKey: "activity.reward.claimed",
              templateParams: {
                rewardName: reward.name,
                karmaCost: reward.karmaCost,
              },
            });
          } catch (error) {
            logger.error("Failed to record activity event for reward claim", {
              claimId: updatedClaim._id.toString(),
              error,
            });
          }
        }

        emitClaimCreated(updatedClaim);
        if (createdTask) {
          emitApprovalTaskCreated(createdTask._id.toString(), updatedClaim, []);
        }

        return toClaimDTO(updatedClaim);
      } catch (error) {
        logger.error("Failed to create auto-task for claim", {
          claimId: claim._id.toString(),
          rewardId: normalizedRewardId,
          error,
        });

        emitClaimCreated(claim);

        return toClaimDTO(claim);
      }
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to create claim", {
        rewardId: normalizedRewardId ?? rewardId,
        familyId: normalizedFamilyId ?? familyId,
        memberId: normalizedMemberId ?? memberId,
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
  async cancelClaim(claimId: string, cancelledBy: string): Promise<ClaimDTO> {
    let normalizedClaimId: ObjectIdString | undefined;
    let normalizedCancelledBy: ObjectIdString | undefined;
    try {
      normalizedClaimId = validateObjectId(claimId, "claimId");
      normalizedCancelledBy = validateObjectId(cancelledBy, "cancelledBy");
      const claimObjectId = toObjectId(normalizedClaimId, "claimId");
      const cancelledByObjectId = toObjectId(
        normalizedCancelledBy,
        "cancelledBy",
      );

      logger.info("Cancelling claim", {
        claimId: normalizedClaimId,
        cancelledBy: normalizedCancelledBy,
      });

      // Step 1: Find the claim
      const claim = await this.claimRepository.findById(claimObjectId);

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
          await this.taskService.deleteTask(
            fromObjectId(claim.familyId),
            claim.autoTaskId.toString(),
            normalizedCancelledBy,
          );
          logger.debug("Auto-task deleted for cancelled claim", {
            taskId: claim.autoTaskId.toString(),
            claimId: normalizedClaimId,
          });
        } catch (error) {
          // Log the error but don't fail the cancellation
          logger.warn("Failed to delete auto-task during claim cancellation", {
            claimId: normalizedClaimId,
            taskId: claim.autoTaskId.toString(),
            error,
          });
        }
      }

      // Step 4: Update claim status to cancelled
      const updatedClaim = await this.claimRepository.updateStatus(
        claimObjectId,
        "cancelled",
        {
          cancelledBy: cancelledByObjectId,
          cancelledAt: new Date(),
        },
      );

      if (!updatedClaim) {
        throw HttpError.notFound("Failed to cancel claim");
      }

      logger.info("Claim cancelled successfully", {
        claimId: normalizedClaimId,
      });

      // Emit real-time event for claim cancellation
      emitClaimCancelled(updatedClaim, normalizedCancelledBy);

      return toClaimDTO(updatedClaim);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to cancel claim", {
        claimId: normalizedClaimId ?? claimId,
        cancelledBy: normalizedCancelledBy ?? cancelledBy,
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
    claimId: string,
    completedBy: string,
  ): Promise<ClaimDTO> {
    let normalizedClaimId: ObjectIdString | undefined;
    let normalizedCompletedBy: ObjectIdString | undefined;
    try {
      normalizedClaimId = validateObjectId(claimId, "claimId");
      normalizedCompletedBy = validateObjectId(completedBy, "completedBy");
      const claimObjectId = toObjectId(normalizedClaimId, "claimId");
      const completedByObjectId = toObjectId(
        normalizedCompletedBy,
        "completedBy",
      );

      logger.info("Completing claim from task", {
        claimId: normalizedClaimId,
        completedBy: normalizedCompletedBy,
      });

      const claim = await this.claimRepository.findById(claimObjectId);

      if (!claim) {
        throw HttpError.notFound("Claim not found");
      }

      if (claim.status !== "pending") {
        throw HttpError.conflict(
          `Cannot complete a ${claim.status} claim. Only pending claims can be completed.`,
        );
      }

      const reward = await this.rewardRepository.findById(claim.rewardId);

      if (!reward) {
        throw HttpError.notFound("Reward not found");
      }

      const memberKarma = await this.karmaService.getMemberKarma(
        fromObjectId(claim.familyId),
        fromObjectId(claim.memberId),
        fromObjectId(claim.memberId),
      );

      if (memberKarma.totalKarma < reward.karmaCost) {
        throw HttpError.badRequest(
          `Member no longer has sufficient karma to complete this claim. Required: ${reward.karmaCost}, Available: ${memberKarma.totalKarma}`,
        );
      }

      const updatedClaim = await this.claimRepository.updateStatus(
        claimObjectId,
        "completed",
        {
          completedBy: completedByObjectId,
          completedAt: new Date(),
        },
      );

      if (!updatedClaim) {
        throw HttpError.notFound("Failed to complete claim");
      }

      try {
        await this.karmaService.deductKarma({
          familyId: fromObjectId(claim.familyId),
          userId: fromObjectId(claim.memberId),
          amount: reward.karmaCost,
          claimId: normalizedClaimId,
          rewardName: reward.name,
        });

        logger.debug("Karma deducted for claim", {
          claimId: normalizedClaimId,
          amount: reward.karmaCost,
        });
      } catch (error) {
        logger.error("Failed to deduct karma for claim completion", {
          claimId: normalizedClaimId,
          error,
        });
      }

      try {
        await this.metadataRepository.incrementClaimCount(
          claim.familyId,
          claim.rewardId,
          claim.memberId,
        );

        logger.debug("Metadata claim count incremented", {
          claimId: normalizedClaimId,
        });
      } catch (error) {
        logger.warn("Failed to increment metadata claim count", {
          claimId: normalizedClaimId,
          error,
        });
      }

      logger.info("Claim completed successfully", {
        claimId: normalizedClaimId,
        rewardId: claim.rewardId.toString(),
      });

      emitClaimCompleted(updatedClaim, normalizedCompletedBy);

      // Send notification to the member who claimed the reward
      await this.notifyMemberOfRewardClaim(
        claim.memberId,
        reward.name,
        reward.karmaCost,
        normalizedClaimId,
      );

      return toClaimDTO(updatedClaim);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to complete claim", {
        claimId: normalizedClaimId ?? claimId,
        completedBy: normalizedCompletedBy ?? completedBy,
        error,
      });
      throw error;
    }
  }

  /**
   * Send reward claim notification to a member
   * @private
   */
  private async notifyMemberOfRewardClaim(
    memberId: ObjectId,
    rewardName: string,
    karmaCost: number,
    claimId: ObjectIdString,
  ): Promise<void> {
    try {
      const locale = await getUserLanguage(memberId);
      // Get the member's name for the notification
      const memberName = await getUserName(memberId);

      const notification = createRewardClaimNotification(
        locale,
        rewardName,
        memberName,
        karmaCost,
      );

      await sendToUser(fromObjectId(memberId), notification);
    } catch (error) {
      logger.error("Failed to send reward claim notification", {
        claimId,
        memberId: memberId.toString(),
        error,
      });
      // Don't throw - notification failure shouldn't prevent claim completion
    }
  }
}
