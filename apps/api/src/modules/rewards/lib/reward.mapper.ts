import type {
  ClaimDTO,
  Reward,
  RewardClaim,
  RewardDetailsDTO,
  RewardDTO,
} from "../domain/reward";

/**
 * Convert Reward domain object to DTO
 * @param reward - Domain reward object
 * @returns RewardDTO with string IDs and ISO date strings
 */
export function toRewardDTO(reward: Reward): RewardDTO {
  return {
    _id: reward._id.toString(),
    familyId: reward.familyId.toString(),
    name: reward.name,
    description: reward.description,
    karmaCost: reward.karmaCost,
    imageUrl: reward.imageUrl,
    createdBy: reward.createdBy.toString(),
    createdAt: reward.createdAt.toISOString(),
    updatedAt: reward.updatedAt.toISOString(),
  };
}

/**
 * Convert RewardClaim domain object to DTO
 * @param claim - Domain claim object
 * @returns ClaimDTO with string IDs and ISO date strings
 */
export function toClaimDTO(claim: RewardClaim): ClaimDTO {
  return {
    _id: claim._id.toString(),
    rewardId: claim.rewardId.toString(),
    familyId: claim.familyId.toString(),
    memberId: claim.memberId.toString(),
    status: claim.status,
    autoTaskId: claim.autoTaskId?.toString(),
    completedBy: claim.completedBy?.toString(),
    cancelledBy: claim.cancelledBy?.toString(),
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    completedAt: claim.completedAt?.toISOString(),
    cancelledAt: claim.cancelledAt?.toISOString(),
  };
}

/**
 * Convert Reward to RewardDetailsDTO with metadata
 * @param reward - Domain reward object
 * @param metadata - Metadata including member's claim count, favourite status, and totals
 * @returns RewardDetailsDTO with enriched metadata
 */
export function toRewardDetailsDTO(
  reward: Reward,
  metadata: {
    memberClaimCount: number;
    memberFavourite: boolean;
    totalClaimCount: number;
    totalFavouriteCount: number;
  },
): RewardDetailsDTO {
  return {
    _id: reward._id.toString(),
    familyId: reward.familyId.toString(),
    name: reward.name,
    description: reward.description,
    karmaCost: reward.karmaCost,
    imageUrl: reward.imageUrl,
    createdBy: reward.createdBy.toString(),
    createdAt: reward.createdAt.toISOString(),
    updatedAt: reward.updatedAt.toISOString(),
    memberFavourite: metadata.memberFavourite,
    claimCount: metadata.memberClaimCount,
    totalClaimCount: metadata.totalClaimCount,
    totalFavouriteCount: metadata.totalFavouriteCount,
  };
}
