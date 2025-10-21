import type { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { requireFamilyRole } from '../lib/require-family-role';
import { FamilyRole } from '@modules/family/domain/family';
import type { AuthenticatedRequest } from './authenticate';
import { HttpError } from '@lib/http-error';

/**
 * Options for family role authorization middleware
 */
export interface AuthorizeFamilyRoleOptions {
  /**
   * Parameter name containing the familyId (default: 'familyId')
   */
  familyIdParam?: string;

  /**
   * Roles that are allowed to access the route
   */
  allowedRoles: FamilyRole[];
}

/**
 * Express middleware factory for family role-based authorization.
 *
 * This middleware checks if the authenticated user has one of the allowed roles
 * in the specified family. It uses the pre-hydrated families from req.user when
 * available for fast authorization without database queries.
 *
 * Prerequisites:
 * - Must be used AFTER the `authenticate` middleware
 * - Requires a familyId route parameter (e.g., /families/:familyId/members)
 *
 * Usage example:
 * ```typescript
 * router.post(
 *   '/families/:familyId/members',
 *   authenticate,
 *   authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] }),
 *   addFamilyMemberHandler
 * );
 * ```
 *
 * @param options - Authorization options
 * @returns Express middleware function
 */
export function authorizeFamilyRole(
  options: AuthorizeFamilyRoleOptions
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { familyIdParam = 'familyId', allowedRoles } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Ensure user is authenticated
      if (!authReq.user) {
        throw HttpError.unauthorized('Authentication required');
      }

      // Extract familyId from route parameters
      const familyIdStr = req.params[familyIdParam];
      if (!familyIdStr) {
        throw HttpError.badRequest(`Missing required parameter: ${familyIdParam}`);
      }

      // Validate familyId format
      if (!ObjectId.isValid(familyIdStr)) {
        throw HttpError.badRequest(`Invalid ${familyIdParam} format`);
      }

      const familyId = new ObjectId(familyIdStr);
      const userId = new ObjectId(authReq.user.id);

      // Check role authorization using pre-hydrated families (fast path)
      await requireFamilyRole({
        userId,
        familyId,
        allowedRoles,
        userFamilies: authReq.user.families,
      });

      // Authorization successful - continue to route handler
      next();
    } catch (error) {
      next(error);
    }
  };
}
