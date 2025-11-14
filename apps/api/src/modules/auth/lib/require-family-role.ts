import { HttpError } from "@lib/http-error";
import type {
  FamilyMembershipView,
  FamilyRole,
} from "@modules/family/domain/family";
import type { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";

/**
 * Options for role-based family authorization
 */
export interface RequireFamilyRoleOptions {
  /**
   * The user's ID (string)
   */
  userId: string;

  /**
   * The family's ID (string)
   */
  familyId: string;

  /**
   * Roles that are allowed to perform the action
   */
  allowedRoles: FamilyRole[];

  /**
   * Pre-hydrated family memberships (from req.user.families)
   * If provided, avoids database lookup
   */
  userFamilies?: FamilyMembershipView[];

  /**
   * Repository for fallback lookup when userFamilies not provided
   * Required if userFamilies is not provided
   */
  membershipRepository?: FamilyMembershipRepository;
}

/**
 * Check if a user has a required role in a specific family.
 *
 * This utility supports two modes of operation:
 * 1. Fast path: Use pre-hydrated families from req.user.families (no DB lookup)
 * 2. Fallback: Query the membership repository when families not hydrated
 *
 * The function returns true if authorized, or throws HttpError.forbidden with
 * a descriptive message if unauthorized.
 *
 * Usage in middleware:
 * ```typescript
 * requireFamilyRole({
 *   userId: req.user.id,
 *   familyId: req.params.familyId,
 *   allowedRoles: [FamilyRole.Parent],
 *   userFamilies: req.user.families,
 *   membershipRepository: membershipRepo,
 * });
 * ```
 *
 * Usage in services:
 * ```typescript
 * await requireFamilyRole({
 *   userId,
 *   familyId,
 *   allowedRoles: [FamilyRole.Parent],
 *   membershipRepository: this.membershipRepo,
 * });
 * ```
 *
 * @param options - Authorization options
 * @returns True if authorized
 * @throws {HttpError} 403 Forbidden if user lacks required role or membership
 */
export async function requireFamilyRole(
  options: RequireFamilyRoleOptions,
): Promise<boolean> {
  const { userId, familyId, allowedRoles, userFamilies, membershipRepository } =
    options;

  // Fast path: Use pre-hydrated families from req.user
  if (userFamilies !== undefined) {
    return checkRoleFromFamilies(familyId, allowedRoles, userFamilies);
  }

  // Fallback path: Query repository
  if (!membershipRepository) {
    throw new Error(
      "Either userFamilies or membershipRepository must be provided",
    );
  }

  return await checkRoleFromRepository(
    userId,
    familyId,
    allowedRoles,
    membershipRepository,
  );
}

/**
 * Check role using pre-hydrated family memberships (sync, no DB call)
 */
function checkRoleFromFamilies(
  familyIdStr: string,
  allowedRoles: FamilyRole[],
  userFamilies: FamilyMembershipView[],
): boolean {
  const membership = userFamilies.find((f) => f.familyId === familyIdStr);

  if (!membership) {
    throw HttpError.forbidden("You are not a member of this family");
  }

  if (!allowedRoles.includes(membership.role)) {
    const rolesStr = formatRolesList(allowedRoles);
    throw HttpError.forbidden(
      `You must be a ${rolesStr} in this family to perform this action`,
    );
  }

  return true;
}

/**
 * Check role using repository lookup (async, requires DB call)
 */
async function checkRoleFromRepository(
  userId: string,
  familyId: string,
  allowedRoles: FamilyRole[],
  repository: FamilyMembershipRepository,
): Promise<boolean> {
  const membership = await repository.findByFamilyAndUser(familyId, userId);

  if (!membership) {
    throw HttpError.forbidden("You are not a member of this family");
  }

  if (!allowedRoles.includes(membership.role)) {
    const rolesStr = formatRolesList(allowedRoles);
    throw HttpError.forbidden(
      `You must be a ${rolesStr} in this family to perform this action`,
    );
  }

  return true;
}

/**
 * Format a list of roles for error messages
 * Examples:
 * - [Parent] → "Parent"
 * - [Parent, Child] → "Parent or Child"
 */
function formatRolesList(roles: FamilyRole[]): string {
  if (roles.length === 1) {
    return roles[0];
  }
  return roles.join(" or ");
}
