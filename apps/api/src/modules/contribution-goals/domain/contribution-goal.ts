import type { ObjectId } from "mongodb";

/**
 * Deduction entry within a contribution goal
 */
export interface Deduction {
  _id: ObjectId;
  amount: number;
  reason: string;
  deductedBy: ObjectId;
  createdAt: Date;
}

/**
 * Contribution Goal entity - represents a weekly contribution goal for a family member
 */
export interface ContributionGoal {
  _id: ObjectId;
  familyId: ObjectId;
  memberId: ObjectId;
  weekStartDate: Date; // Sunday 18:00 UTC
  title: string; // Max 200 chars
  description: string; // Max 2000 chars
  maxKarma: number; // 1-10000
  deductions: Deduction[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Deduction DTO for API responses
 */
export interface DeductionDTO {
  _id: string;
  amount: number;
  reason: string;
  deductedBy: string;
  createdAt: string;
}

/**
 * Contribution Goal DTO for API responses
 */
export interface ContributionGoalDTO {
  _id: string;
  familyId: string;
  memberId: string;
  weekStartDate: string;
  title: string;
  description: string;
  maxKarma: number;
  currentKarma: number; // Calculated: maxKarma - sum of deduction amounts
  deductions: DeductionDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input DTO for creating a contribution goal
 */
export interface CreateContributionGoalInput {
  memberId: string;
  title: string;
  description: string;
  maxKarma: number;
}

/**
 * Input DTO for updating a contribution goal
 */
export interface UpdateContributionGoalInput {
  title?: string;
  description?: string;
  maxKarma?: number;
}

/**
 * Input DTO for adding a deduction
 */
export interface AddDeductionInput {
  amount: number;
  reason: string;
}
