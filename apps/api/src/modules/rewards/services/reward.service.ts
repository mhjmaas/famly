import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { ObjectId } from "mongodb";
import type {
  CreateRewardInput,
  RewardDetailsDTO,
  RewardDTO,
  UpdateRewardInput,
} from "../domain/reward";
import {
  emitRewardCreated,
  emitRewardDeleted,
  emitRewardUpdated,
} from "../events/reward-events";
import { toRewardDetailsDTO, toRewardDTO } from "../lib/reward.mapper";
import type { MetadataRepository } from "../repositories/metadata.repository";
import type { RewardRepository } from "../repositories/reward.repository";

/**
 * Service for reward business logic
 * Handles CRUD operations and integrates with metadata for rich responses
 */
export class RewardService {
  constructor(
    private rewardRepository: RewardRepository,
    private metadataRepository: MetadataRepository,
  ) {}

  /**
   * Create a new reward in a family
   * @param familyId - The family ID
   * @param createdBy - User ID of the parent creating the reward
   * @param input - Reward creation input
   * @returns The created reward as DTO
   */
  async createReward(
    familyId: ObjectId,
    createdBy: ObjectId,
    input: CreateRewardInput,
  ): Promise<RewardDTO> {
    try {
      logger.info("Creating reward", {
        familyId: familyId.toString(),
        createdBy: createdBy.toString(),
        rewardName: input.name,
      });

      const reward = await this.rewardRepository.create(
        familyId,
        input,
        createdBy,
      );

      logger.info("Reward created successfully", {
        rewardId: reward._id.toString(),
        familyId: familyId.toString(),
      });

      // Emit reward created event
      await emitRewardCreated(reward._id, familyId, reward.name);

      return toRewardDTO(reward);
    } catch (error) {
      logger.error("Failed to create reward", {
        familyId: familyId.toString(),
        createdBy: createdBy.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * List rewards for a family
   * @param familyId - The family ID
   * @param requestingUserId - User ID of the requester
   * @param memberId - Optional member ID to filter by (unused in current implementation)
   * @returns Array of reward DTOs
   */
  async listRewards(
    familyId: ObjectId,
    requestingUserId: ObjectId,
    memberId?: ObjectId,
  ): Promise<RewardDTO[]> {
    try {
      logger.debug("Listing rewards", {
        familyId: familyId.toString(),
        requestingUserId: requestingUserId.toString(),
        memberId: memberId?.toString(),
      });

      const rewards = await this.rewardRepository.findByFamily(familyId);

      // Enrich rewards with member-specific metadata
      const enrichedRewards = await Promise.all(
        rewards.map(async (reward) => {
          const metadata = await this.metadataRepository.findByRewardAndMember(
            reward._id,
            requestingUserId,
          );

          return {
            ...toRewardDTO(reward),
            isFavourite: metadata?.isFavourite ?? false,
            claimCount: metadata?.claimCount ?? 0,
          };
        }),
      );

      return enrichedRewards;
    } catch (error) {
      logger.error("Failed to list rewards", {
        familyId: familyId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Get detailed information about a reward including metadata
   * @param familyId - The family ID
   * @param rewardId - The reward ID
   * @param requestingUserId - User ID of the requester
   * @returns Reward details with metadata
   * @throws HttpError with 404 if reward not found or belongs to different family
   */
  async getReward(
    familyId: ObjectId,
    rewardId: ObjectId,
    requestingUserId: ObjectId,
  ): Promise<RewardDetailsDTO> {
    try {
      logger.debug("Getting reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
        requestingUserId: requestingUserId.toString(),
      });

      const reward = await this.rewardRepository.findById(rewardId);

      if (!reward || reward.familyId.toString() !== familyId.toString()) {
        throw HttpError.notFound("Reward not found");
      }

      // Fetch metadata for the requesting user
      const metadata = await this.metadataRepository.findByRewardAndMember(
        rewardId,
        requestingUserId,
      );

      // Fetch aggregated metadata
      const totalClaimCount =
        await this.metadataRepository.getTotalClaimCount(rewardId);
      const totalFavouriteCount =
        await this.metadataRepository.getTotalFavouriteCount(rewardId);

      return toRewardDetailsDTO(reward, {
        claimCount: metadata?.claimCount ?? 0,
        isFavourite: metadata?.isFavourite ?? false,
        totalClaimCount,
        totalFavouriteCount,
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to get reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Update a reward
   * @param familyId - The family ID
   * @param rewardId - The reward ID
   * @param input - Update input with optional fields
   * @returns Updated reward DTO
   * @throws HttpError with 404 if reward not found or belongs to different family
   */
  async updateReward(
    familyId: ObjectId,
    rewardId: ObjectId,
    input: UpdateRewardInput,
  ): Promise<RewardDTO> {
    try {
      logger.info("Updating reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
      });

      // Verify reward exists and belongs to family
      const reward = await this.rewardRepository.findById(rewardId);

      if (!reward || reward.familyId.toString() !== familyId.toString()) {
        throw HttpError.notFound("Reward not found");
      }

      // Update the reward
      const updated = await this.rewardRepository.update(rewardId, input);

      if (!updated) {
        throw HttpError.notFound("Reward not found");
      }

      logger.info("Reward updated successfully", {
        rewardId: rewardId.toString(),
      });

      // Emit reward updated event
      await emitRewardUpdated(rewardId, familyId, updated.name);

      return toRewardDTO(updated);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to update reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
        error,
      });
      throw error;
    }
  }

  /**
   * Delete a reward
   * @param familyId - The family ID
   * @param rewardId - The reward ID
   * @throws HttpError with 404 if reward not found
   * @throws HttpError with 409 if reward has pending claims
   */
  async deleteReward(familyId: ObjectId, rewardId: ObjectId): Promise<void> {
    try {
      logger.info("Deleting reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
      });

      // Verify reward exists and belongs to family
      const reward = await this.rewardRepository.findById(rewardId);

      if (!reward || reward.familyId.toString() !== familyId.toString()) {
        throw HttpError.notFound("Reward not found");
      }

      // Check for pending claims
      const hasPendingClaims =
        await this.rewardRepository.hasPendingClaims(rewardId);

      if (hasPendingClaims) {
        throw HttpError.conflict(
          "Cannot delete reward with pending claims. Cancel or complete all claims first.",
        );
      }

      // Store reward name for event emission
      const rewardName = reward.name;

      // Delete the reward
      await this.rewardRepository.delete(rewardId);

      logger.info("Reward deleted successfully", {
        rewardId: rewardId.toString(),
      });

      // Emit reward deleted event
      await emitRewardDeleted(rewardId, familyId, rewardName);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to delete reward", {
        familyId: familyId.toString(),
        rewardId: rewardId.toString(),
        error,
      });
      throw error;
    }
  }
}
