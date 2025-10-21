import { Family, FamilyMembership, FamilyMembershipView, FamilyRole } from '../domain/family';
import { HttpError } from '@lib/http-error';

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
  membership: FamilyMembership
): FamilyMembershipView {
  // Validate role is one of the allowed values
  if (!Object.values(FamilyRole).includes(membership.role)) {
    throw HttpError.badRequest(
      `Invalid role: ${membership.role}. Only Parent and Child roles are supported.`
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
      `Invalid role: ${role}. Only Parent and Child roles are supported.`
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
  if (!name || typeof name !== 'string') {
    return null;
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > 120) {
    throw HttpError.badRequest('Family name cannot exceed 120 characters.');
  }

  return trimmed;
}
