import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import {
  type ObjectIdString,
  toObjectId,
  validateObjectId,
} from "@lib/objectid-utils";
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
    familyId: string,
    createdBy: string,
    input: CreateRewardInput,
  ): Promise<RewardDTO> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedCreatedBy: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedCreatedBy = validateObjectId(createdBy, "createdBy");
      const familyObjectId = toObjectId(normalizedFamilyId, "familyId");
      const createdByObjectId = toObjectId(normalizedCreatedBy, "createdBy");

      logger.info("Creating reward", {
        familyId: normalizedFamilyId,
        createdBy: normalizedCreatedBy,
        rewardName: input.name,
      });

      const reward = await this.rewardRepository.create(
        familyObjectId,
        input,
        createdByObjectId,
      );

      logger.info("Reward created successfully", {
        rewardId: reward._id.toString(),
        familyId: normalizedFamilyId,
      });

      // Emit reward created event
      await emitRewardCreated(reward._id, familyObjectId, reward.name);

      return toRewardDTO(reward);
    } catch (error) {
      logger.error("Failed to create reward", {
        familyId: normalizedFamilyId ?? familyId,
        createdBy: normalizedCreatedBy ?? createdBy,
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
    familyId: string,
    requestingUserId: string,
    _memberId?: string,
  ): Promise<RewardDTO[]> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedRequestingUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedRequestingUserId = validateObjectId(
        requestingUserId,
        "requestingUserId",
      );
      const familyObjectId = toObjectId(normalizedFamilyId, "familyId");
      const requesterObjectId = toObjectId(
        normalizedRequestingUserId,
        "requestingUserId",
      );

      logger.debug("Listing rewards", {
        familyId: normalizedFamilyId,
        requestingUserId: normalizedRequestingUserId,
      });

      const rewards = await this.rewardRepository.findByFamily(familyObjectId);

      // Enrich rewards with member-specific metadata
      const enrichedRewards = await Promise.all(
        rewards.map(async (reward) => {
          const metadata = await this.metadataRepository.findByRewardAndMember(
            reward._id,
            requesterObjectId,
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
        familyId: normalizedFamilyId ?? familyId,
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
    familyId: string,
    rewardId: string,
    requestingUserId: string,
  ): Promise<RewardDetailsDTO> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedRewardId: ObjectIdString | undefined;
    let normalizedRequestingUserId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedRewardId = validateObjectId(rewardId, "rewardId");
      normalizedRequestingUserId = validateObjectId(
        requestingUserId,
        "requestingUserId",
      );
      const rewardObjectId = toObjectId(normalizedRewardId, "rewardId");
      const requesterObjectId = toObjectId(
        normalizedRequestingUserId,
        "requestingUserId",
      );

      logger.debug("Getting reward", {
        familyId: normalizedFamilyId,
        rewardId: normalizedRewardId,
        requestingUserId: normalizedRequestingUserId,
      });

      const reward = await this.rewardRepository.findById(rewardObjectId);

      if (!reward || reward.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.notFound("Reward not found");
      }

      const metadata = await this.metadataRepository.findByRewardAndMember(
        rewardObjectId,
        requesterObjectId,
      );

      const totalClaimCount =
        await this.metadataRepository.getTotalClaimCount(rewardObjectId);
      const totalFavouriteCount =
        await this.metadataRepository.getTotalFavouriteCount(rewardObjectId);

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
        familyId: normalizedFamilyId ?? familyId,
        rewardId: normalizedRewardId ?? rewardId,
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
    familyId: string,
    rewardId: string,
    input: UpdateRewardInput,
  ): Promise<RewardDTO> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedRewardId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedRewardId = validateObjectId(rewardId, "rewardId");
      const familyObjectId = toObjectId(normalizedFamilyId, "familyId");
      const rewardObjectId = toObjectId(normalizedRewardId, "rewardId");

      logger.info("Updating reward", {
        familyId: normalizedFamilyId,
        rewardId: normalizedRewardId,
      });

      const reward = await this.rewardRepository.findById(rewardObjectId);

      if (!reward || reward.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.notFound("Reward not found");
      }

      const updated = await this.rewardRepository.update(rewardObjectId, input);

      if (!updated) {
        throw HttpError.notFound("Reward not found");
      }

      logger.info("Reward updated successfully", {
        rewardId: normalizedRewardId,
      });

      await emitRewardUpdated(rewardObjectId, familyObjectId, updated.name);

      return toRewardDTO(updated);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to update reward", {
        familyId: normalizedFamilyId ?? familyId,
        rewardId: normalizedRewardId ?? rewardId,
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
  async deleteReward(familyId: string, rewardId: string): Promise<void> {
    let normalizedFamilyId: ObjectIdString | undefined;
    let normalizedRewardId: ObjectIdString | undefined;
    try {
      normalizedFamilyId = validateObjectId(familyId, "familyId");
      normalizedRewardId = validateObjectId(rewardId, "rewardId");
      const familyObjectId = toObjectId(normalizedFamilyId, "familyId");
      const rewardObjectId = toObjectId(normalizedRewardId, "rewardId");

      logger.info("Deleting reward", {
        familyId: normalizedFamilyId,
        rewardId: normalizedRewardId,
      });

      const reward = await this.rewardRepository.findById(rewardObjectId);

      if (!reward || reward.familyId.toString() !== normalizedFamilyId) {
        throw HttpError.notFound("Reward not found");
      }

      const hasPendingClaims =
        await this.rewardRepository.hasPendingClaims(rewardObjectId);

      if (hasPendingClaims) {
        throw HttpError.conflict(
          "Cannot delete reward with pending claims. Cancel or complete all claims first.",
        );
      }

      const rewardName = reward.name;

      await this.rewardRepository.delete(rewardObjectId);

      logger.info("Reward deleted successfully", {
        rewardId: normalizedRewardId,
      });

      await emitRewardDeleted(rewardObjectId, familyObjectId, rewardName);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }

      logger.error("Failed to delete reward", {
        familyId: normalizedFamilyId ?? familyId,
        rewardId: normalizedRewardId ?? rewardId,
        error,
      });
      throw error;
    }
  }
}
