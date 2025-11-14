import { HttpError } from "@lib/http-error";
import { fromObjectId } from "@lib/objectid-utils";
import type { ObjectId } from "mongodb";

/**
 * Options for creator-based ownership authorization
 */
export interface RequireCreatorOwnershipOptions {
  /**
   * The user's ID (string)
   */
  userId: string;

  /**
   * The createdBy field from the resource (can be ObjectId or string)
   * Either provide this directly OR provide resourceId + lookupFn
   */
  createdBy?: ObjectId | string;

  /**
   * The resource's ID for database lookup (string)
   * Required if createdBy is not provided
   */
  resourceId?: string;

  /**
   * Repository lookup function that fetches a resource by ID
   * Required if createdBy is not provided
   * Returns the resource or null if not found
   */
  lookupFn?: (id: string) => Promise<{ createdBy: ObjectId } | null>;
}

/**
 * Check if a user is the creator of a resource.
 *
 * This utility supports two modes of operation:
 * 1. Direct check: Compare userId with provided createdBy ObjectId (no DB lookup)
 * 2. Lookup: Query repository to fetch resource and verify createdBy field
 *
 * The function returns true if authorized, or throws HttpError with a descriptive
 * message if unauthorized.
 *
 * Usage for direct ownership check:
 * ```typescript
 * await requireCreatorOwnership({
 *   userId: req.user.id,
 *   createdBy: resource.createdBy,
 * });
 * ```
 *
 * Usage with repository lookup:
 * ```typescript
 * await requireCreatorOwnership({
 *   userId: req.user.id,
 *   resourceId: req.params.resourceId,
 *   lookupFn: async (id) => {
 *     const resource = await repository.findById(id);
 *     return resource ? { createdBy: resource.createdBy } : null;
 *   }
 * });
 * ```
 *
 * @param options - Authorization options
 * @returns True if authorized
 * @throws {HttpError} 403 Forbidden if user is not the creator
 * @throws {HttpError} 404 Not Found if resource does not exist
 */
export async function requireCreatorOwnership(
  options: RequireCreatorOwnershipOptions,
): Promise<boolean> {
  const { userId, createdBy, resourceId, lookupFn } = options;

  // Direct check: Use provided createdBy value
  if (createdBy !== undefined) {
    return checkDirectOwnership(userId, createdBy);
  }

  // Lookup path: Query repository for resource
  if (resourceId === undefined || lookupFn === undefined) {
    throw new Error(
      "Either createdBy or both resourceId and lookupFn must be provided",
    );
  }

  return await checkOwnershipViaLookup(userId, resourceId, lookupFn);
}

/**
 * Check ownership using directly provided createdBy value (sync)
 */
function checkDirectOwnership(
  userId: string,
  createdBy: ObjectId | string,
): boolean {
  // Normalize createdBy to string for comparison
  const createdByStr =
    typeof createdBy === "string" ? createdBy : fromObjectId(createdBy);

  if (userId !== createdByStr) {
    throw HttpError.forbidden(
      "You do not have permission to access this resource",
    );
  }

  return true;
}

/**
 * Check ownership via repository lookup (async)
 */
async function checkOwnershipViaLookup(
  userId: string,
  resourceId: string,
  lookupFn: (id: string) => Promise<{ createdBy: ObjectId } | null>,
): Promise<boolean> {
  const resource = await lookupFn(resourceId);

  if (!resource) {
    throw HttpError.notFound("Resource not found");
  }

  // Convert ObjectId createdBy to string for comparison
  const createdByStr = fromObjectId(resource.createdBy);

  if (userId !== createdByStr) {
    throw HttpError.forbidden(
      "You do not have permission to access this resource",
    );
  }

  return true;
}
