import { ObjectId } from 'mongodb';

/**
 * Family role enum
 * Defines the allowed roles for family memberships
 */
export enum FamilyRole {
  Parent = 'Parent',
  Child = 'Child',
}

/**
 * Family document structure in MongoDB
 */
export interface Family {
  _id: ObjectId;
  name: string | null;
  creatorId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Family membership document structure in MongoDB
 * Links users to families with specific roles
 */
export interface FamilyMembership {
  _id: ObjectId;
  familyId: ObjectId;
  userId: ObjectId;
  role: FamilyRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Family membership view DTO
 * Used in API responses, JWT claims, and /v1/auth/me payload
 */
export interface FamilyMembershipView {
  familyId: string;
  name: string | null;
  role: FamilyRole;
  linkedAt: string; // ISO 8601 timestamp
}

/**
 * Create family input payload
 */
export interface CreateFamilyInput {
  name?: string | null;
}

/**
 * Create family response
 */
export type CreateFamilyResponse = FamilyMembershipView;

/**
 * List families response
 */
export type ListFamiliesResponse = FamilyMembershipView[];
