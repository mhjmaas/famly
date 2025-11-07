import type { ObjectId } from "mongodb";

/**
 * Reward entity - represents a family reward that members can claim
 */
export interface Reward {
  /** Unique identifier */
  _id: ObjectId;
  /** Family this reward belongs to */
  familyId: ObjectId;
  /** Display name (1-100 chars) */
  name: string;
  /** Optional description (max 500 chars) */
  description?: string;
  /** Karma cost to claim this reward (1-1000) */
  karmaCost: number;
  /** Optional URL to reward image (max 500 chars) */
  imageUrl?: string;
  /** Parent who created this reward */
  createdBy: ObjectId;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Claim status values
 */
export type ClaimStatus = "pending" | "completed" | "cancelled";

/**
 * Reward claim entity - tracks a member's claim for a reward
 */
export interface RewardClaim {
  /** Unique identifier */
  _id: ObjectId;
  /** The reward being claimed */
  rewardId: ObjectId;
  /** Family context */
  familyId: ObjectId;
  /** Member claiming the reward */
  memberId: ObjectId;
  /** Current claim status */
  status: ClaimStatus;
  /** Optional reference to auto-generated approval task */
  autoTaskId?: ObjectId;
  /** Parent who completed the claim (if status=completed) */
  completedBy?: ObjectId;
  /** User who cancelled the claim (if status=cancelled) */
  cancelledBy?: ObjectId;
  /** Claim creation timestamp */
  createdAt: Date;
  /** Last status update timestamp */
  updatedAt: Date;
  /** Completion timestamp (if completed) */
  completedAt?: Date;
  /** Cancellation timestamp (if cancelled) */
  cancelledAt?: Date;
}

/**
 * Reward metadata - tracks per-member information about rewards
 * Uses composite ID: ${familyId}_${rewardId}_${memberId}
 */
export interface RewardMetadata {
  /** Composite key: familyId_rewardId_memberId */
  _id: string;
  /** Family context */
  familyId: ObjectId;
  /** The reward */
  rewardId: ObjectId;
  /** Family member */
  memberId: ObjectId;
  /** Whether this member has marked the reward as favourite */
  isFavourite: boolean;
  /** Total number of times this member has claimed this reward */
  claimCount: number;
  /** Last metadata update timestamp */
  updatedAt: Date;
}

/**
 * DTO for Reward API responses
 */
export interface RewardDTO {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  karmaCost: number;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  claimCount?: number;
  isFavourite?: boolean;
}

/**
 * DTO for Reward Claim API responses
 */
export interface ClaimDTO {
  _id: string;
  rewardId: string;
  familyId: string;
  memberId: string;
  status: ClaimStatus;
  autoTaskId?: string;
  completedBy?: string;
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

/**
 * Extended reward DTO with metadata
 */
export interface RewardDetailsDTO extends RewardDTO {
  /** Whether current member has marked as favourite */
  isFavourite: boolean;
  /** Total number of times current member has claimed this reward */
  claimCount: number;
  /** Total number of times any member has claimed this reward */
  totalClaimCount: number;
  /** Total members who have marked as favourite */
  totalFavouriteCount: number;
}

/**
 * Input DTO for creating a reward
 */
export interface CreateRewardInput {
  name: string;
  description?: string;
  karmaCost: number;
  imageUrl?: string;
}

/**
 * Input DTO for updating a reward
 */
export interface UpdateRewardInput {
  name?: string;
  description?: string;
  karmaCost?: number;
  imageUrl?: string;
}

/**
 * Input DTO for claiming a reward
 */
export interface ClaimRewardInput {
  rewardId: string;
}

/**
 * Input DTO for toggling favourite status
 */
export interface ToggleFavouriteInput {
  isFavourite: boolean;
}
