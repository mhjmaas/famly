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
  | "REWARD";

/**
 * Activity event entity - represents a user activity record
 */
export interface ActivityEvent {
  _id: ObjectId;
  userId: ObjectId;
  type: ActivityEventType;
  title: string; // Max 200 chars
  description?: string; // Optional, max 2000 chars
  metadata?: {
    karma?: number; // Optional karma value
  };
  createdAt: Date;
}

/**
 * Input for recording a new activity event
 */
export interface RecordActivityEventInput {
  userId: ObjectId;
  type: ActivityEventType;
  title: string;
  description?: string;
  metadata?: {
    karma?: number;
  };
}

/**
 * DTO for activity event API responses
 */
export interface ActivityEventDTO {
  id: string;
  userId: string;
  type: ActivityEventType;
  title: string;
  description: string | null;
  metadata: {
    karma?: number;
  } | null;
  createdAt: string; // ISO 8601 timestamp
}
