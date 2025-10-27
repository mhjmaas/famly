import type { ObjectId } from "mongodb";

/**
 * Karma source types
 * - task_completion: Karma awarded for completing a task
 * - manual_grant: Karma manually granted by a parent
 */
export type KarmaSource = "task_completion" | "manual_grant";

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
  amount: number; // Always > 0 (no negative karma in MVP)
  source: KarmaSource;
  description: string; // e.g., "Completed task Wash dishes"
  metadata?: {
    taskId?: string; // For task_completion source
    grantedBy?: string; // For manual_grant source
  };
  createdAt: Date;
}

/**
 * Input for awarding karma to a user
 */
export interface AwardKarmaInput {
  familyId: ObjectId;
  userId: ObjectId;
  amount: number;
  source: KarmaSource;
  description: string;
  metadata?: {
    taskId?: string;
    grantedBy?: string;
  };
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
