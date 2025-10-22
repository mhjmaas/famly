import { ObjectId } from "mongodb";

/**
 * Task assignment discriminated union
 * Supports three types: specific member, role-based, or unassigned
 */
export type TaskAssignment =
  | { type: "member"; memberId: ObjectId }
  | { type: "role"; role: "parent" | "child" }
  | { type: "unassigned" };

/**
 * Task entity - represents an individual task instance
 */
export interface Task {
  _id: ObjectId;
  familyId: ObjectId;
  name: string; // Max 200 chars
  description?: string; // Optional, max 2000 chars
  dueDate?: Date; // Optional due datetime
  assignment: TaskAssignment;
  scheduleId?: ObjectId; // Reference if generated from schedule
  completedAt?: Date; // Optional completion timestamp
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export schedule types for backward compatibility
export type {
  Schedule,
  TaskSchedule,
  CreateScheduleInput,
  UpdateScheduleInput,
  TaskScheduleDTO,
} from "./task-schedule";

/**
 * Input DTO for creating a task
 */
export interface CreateTaskInput {
  name: string;
  description?: string;
  dueDate?: Date;
  assignment: TaskAssignment;
}

/**
 * Input DTO for updating a task
 */
export interface UpdateTaskInput {
  name?: string;
  description?: string;
  dueDate?: Date;
  assignment?: TaskAssignment;
  completedAt?: Date | null;
}

/**
 * Output DTO for task API responses
 */
export interface TaskDTO {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  dueDate?: string;
  assignment: TaskAssignment;
  scheduleId?: string;
  completedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
