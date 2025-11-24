import type { ObjectId } from "mongodb";

/**
 * Activity event type enum
 * High-level categories for different types of user activities
 */
export type ActivityEventType =
  | "TASK"
  | "SHOPPING_LIST"
  | "KARMA"
  | "RECIPE"
  | "DIARY"
  | "FAMILY_DIARY"
  | "REWARD"
  | "CONTRIBUTION_GOAL";

/**
 * Activity event entity - represents a user activity record
 */
export interface ActivityEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: ActivityEventType;
  detail?: string; // Granular action type (e.g., "CREATED", "COMPLETED")
  title: string; // Max 200 chars
  description?: string; // Optional, max 2000 chars
  metadata?: {
    karma?: number; // Optional karma value
    triggeredBy?: ObjectId; // Optional: user who triggered the action
  };
  templateKey?: string;
  templateParams?: Record<string, string | number>;
  locale?: string;
  createdAt: Date;
}

/**
 * Input for recording a new activity event
 */
export interface RecordActivityEventInput {
  userId: ObjectId;
  type: ActivityEventType;
  detail?: string;
  title: string;
  description?: string;
  metadata?: {
    karma?: number;
    triggeredBy?: ObjectId;
  };
  templateKey?: string;
  templateParams?: Record<string, string | number>;
  locale?: string;
}

/**
 * DTO for activity event API responses
 */
export interface ActivityEventDTO {
  id: string;
  userId: string;
  type: ActivityEventType;
  detail?: string;
  title: string;
  description: string | null;
  metadata: {
    karma?: number;
    triggeredBy?: string;
  } | null;
  templateKey?: string;
  templateParams?: Record<string, string | number>;
  locale?: string;
  createdAt: string; // ISO 8601 timestamp
}
