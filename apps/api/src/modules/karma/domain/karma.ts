import type { ObjectIdString } from "@lib/objectid-utils";
import type { ObjectId } from "mongodb";

/**
 * Karma source types
 * - task_completion: Karma awarded for completing a task
 * - task_uncomplete: Karma deducted for uncompleting a task
 * - manual_grant: Karma manually granted by a parent
 * - reward_redemption: Karma deducted for redeeming a reward
 * - contribution_goal_weekly: Karma awarded for weekly contribution goal
 */
export type KarmaSource =
  | "task_completion"
  | "task_uncomplete"
  | "manual_grant"
  | "reward_redemption"
  | "contribution_goal_weekly";

/**
 * Member karma aggregate
 * Stores the total karma for a specific member in a specific family
 */
export interface MemberKarma {
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  totalKarma: number; // Always >= 0
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Karma event
 * Individual karma transaction record with source, amount, and description
 */
export interface KarmaEvent {
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  amount: number; // Positive for additions, negative for deductions (e.g., -50 for reward_redemption)
  source: KarmaSource;
  description: string; // e.g., "Completed task Wash dishes" or "Redeemed reward Extra screen time"
  metadata?: {
    taskId?: string; // For task_completion source
    grantedBy?: string; // For manual_grant source
    claimId?: string; // For reward_redemption source
  };
  createdAt: Date;
}

/**
 * Input for awarding karma to a user
 */
export interface AwardKarmaInput {
  familyId: ObjectIdString;
  userId: ObjectIdString;
  amount: number; // Positive for additions, negative for deductions
  source: KarmaSource;
  description: string;
  metadata?: {
    taskId?: string;
    grantedBy?: string;
    claimId?: string;
  };
}

/**
 * Input for deducting karma from a user
 */
export interface DeductKarmaInput {
  familyId: ObjectIdString;
  userId: ObjectIdString;
  amount: number; // Positive number representing the deduction (e.g., 50 for 50 karma)
  claimId: string; // Reference to the reward claim
  rewardName: string; // Name of the reward being redeemed
}

/**
 * DTO for member karma API response
 */
export interface MemberKarmaDTO {
  familyId: string;
  userId: string;
  totalKarma: number;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * DTO for karma event API response
 */
export interface KarmaEventDTO {
  id: string;
  familyId: string;
  userId: string;
  amount: number;
  source: KarmaSource;
  description: string;
  metadata?: {
    taskId?: string;
    grantedBy?: string;
  };
  createdAt: string; // ISO 8601 timestamp
}

/**
 * Response for karma history endpoint with pagination
 */
export interface KarmaHistoryResponse {
  events: KarmaEventDTO[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
  };
}
