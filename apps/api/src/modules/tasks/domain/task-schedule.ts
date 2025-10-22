import { ObjectId } from "mongodb";
import type { TaskAssignment } from "./task";

/**
 * Schedule recurrence configuration
 */
export interface Schedule {
  daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
  weeklyInterval: 1 | 2 | 3 | 4;
  startDate: Date;
  endDate?: Date; // Optional for indefinite schedules
}

/**
 * TaskSchedule entity - represents a recurring task template
 */
export interface TaskSchedule {
  _id: ObjectId;
  familyId: ObjectId;
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: Schedule;
  timeOfDay?: string; // Optional HH:mm for due time
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastGeneratedDate?: Date; // Track last generation run
}

/**
 * Input DTO for creating a schedule
 */
export interface CreateScheduleInput {
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: Schedule;
  timeOfDay?: string;
}

/**
 * Input DTO for updating a schedule
 */
export interface UpdateScheduleInput {
  name?: string;
  description?: string;
  assignment?: TaskAssignment;
  schedule?: Schedule;
  timeOfDay?: string;
}

/**
 * Output DTO for schedule API responses
 */
export interface TaskScheduleDTO {
  _id: string;
  familyId: string;
  name: string;
  description?: string;
  assignment: TaskAssignment;
  schedule: Schedule;
  timeOfDay?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastGeneratedDate?: string;
}
