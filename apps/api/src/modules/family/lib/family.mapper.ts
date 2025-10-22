import { HttpError } from "@lib/http-error";
import type { ObjectId } from "mongodb";
import {
  type AddFamilyMemberResult,
  type Family,
  type FamilyMembership,
  type FamilyMembershipView,
  FamilyRole,
  type ListFamiliesResponse,
} from "../domain/family";

export interface FamilyMemberView {
  memberId: string;
  name: string;
  birthdate: string | Date; // ISO 8601 date string or Date object
  role: FamilyRole;
  linkedAt: string;
  addedBy?: string;
}

export type FamiliesWithMembersResponse = Array<
  FamilyMembershipView & { members: FamilyMemberView[] }
>;

/**
 * Maps MongoDB family and membership documents to the canonical FamilyMembershipView DTO
 * Used across routes, JWT claims, and /v1/auth/me responses
 *
 * @param family - Family document from MongoDB
 * @param membership - FamilyMembership document from MongoDB
 * @returns FamilyMembershipView DTO
 */
export function toFamilyMembershipView(
  family: Family,
  membership: FamilyMembership,
): FamilyMembershipView {
  // Validate role is one of the allowed values
  if (!Object.values(FamilyRole).includes(membership.role)) {
    throw HttpError.badRequest(
      `Invalid role: ${membership.role}. Only Parent and Child roles are supported.`,
    );
  }

  return {
    familyId: family._id.toString(),
    name: family.name,
    role: membership.role,
    linkedAt: membership.createdAt.toISOString(),
  };
}

/**
 * Validates that a role string matches one of the allowed FamilyRole values
 *
 * @param role - The role string to validate
 * @throws HttpError if role is invalid
 */
export function validateRole(role: string): asserts role is FamilyRole {
  if (!Object.values(FamilyRole).includes(role as FamilyRole)) {
    throw HttpError.badRequest(
      `Invalid role: ${role}. Only Parent and Child roles are supported.`,
    );
  }
}

/**
 * Normalizes optional family name input
 * - Trims whitespace
 * - Converts empty string to null
 * - Enforces max length
 *
 * @param name - Optional name input
 * @returns Normalized name or null
 */
export function normalizeFamilyName(name?: string | null): string | null {
  if (!name || typeof name !== "string") {
    return null;
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > 120) {
    throw HttpError.badRequest("Family name cannot exceed 120 characters.");
  }

  return trimmed;
}

/**
 * Maps family membership creation result to AddFamilyMemberResult DTO
 * Used when a parent adds a new member to their family
 *
 * @param membership - FamilyMembership document from MongoDB
 * @param familyId - Family ObjectId
 * @param addedBy - Parent ObjectId who added the member
 * @returns AddFamilyMemberResult DTO
 */
export function toAddFamilyMemberResult(
  membership: FamilyMembership,
  familyId: ObjectId,
  addedBy: ObjectId,
): AddFamilyMemberResult {
  return {
    memberId: membership.userId.toString(),
    familyId: familyId.toString(),
    role: membership.role,
    linkedAt: membership.createdAt.toISOString(),
    addedBy: addedBy.toString(),
  };
}

/**
 * Maps membership document to response view used when listing families with members
 *
 * @param membership - FamilyMembership document from MongoDB
 * @param userName - User's name from the user collection
 * @param userBirthdate - User's birthdate from the user collection
 * @returns FamilyMemberView DTO
 */
export function toFamilyMemberView(
  membership: FamilyMembership,
  userName: string,
  userBirthdate: string | Date,
): FamilyMemberView {
  return {
    memberId: membership.userId.toString(),
    name: userName,
    birthdate:
      typeof userBirthdate === "string"
        ? userBirthdate
        : userBirthdate.toISOString(),
    role: membership.role,
    linkedAt: membership.createdAt.toISOString(),
    ...(membership.addedBy ? { addedBy: membership.addedBy.toString() } : {}),
  };
}

/**
 * Combines family membership views with their linked members
 * Requires user data to be passed with memberships for name and birthdate
 *
 * @param families - Existing family membership views for the authenticated user
 * @param memberships - Membership documents with associated user data
 * @returns Families listed with their members
 */
export function buildFamiliesWithMembersResponse(
  families: ListFamiliesResponse,
  memberships: Array<
    FamilyMembership & { user?: { name: string; birthdate: string | Date } }
  >,
): FamiliesWithMembersResponse {
  const membersByFamily = new Map<string, FamilyMemberView[]>();

  for (const membership of memberships) {
    const familyKey = membership.familyId.toString();
    const memberViews = membersByFamily.get(familyKey);

    const userName = membership.user?.name || "";
    const userBirthdate = membership.user?.birthdate || "";

    if (memberViews) {
      memberViews.push(toFamilyMemberView(membership, userName, userBirthdate));
    } else {
      membersByFamily.set(familyKey, [
        toFamilyMemberView(membership, userName, userBirthdate),
      ]);
    }
  }

  return families.map((family) => ({
    ...family,
    members: membersByFamily.get(family.familyId) ?? [],
  }));
}
