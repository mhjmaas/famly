import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import { requireCreatorOwnership } from "../lib/require-creator-ownership";
import type { AuthenticatedRequest } from "./authenticate";

/**
 * Options for creator ownership authorization middleware
 */
export interface AuthorizeCreatorOwnershipOptions {
  /**
   * Parameter name containing the resource ID (default: 'resourceId')
   */
  resourceIdParam?: string;

  /**
   * Repository lookup function that fetches a resource by ID
   * Should return the resource (or resource object with at least createdBy field) or null
   */
  lookupFn: (id: ObjectId) => Promise<{ createdBy: ObjectId } | null>;
}

/**
 * Express middleware factory for creator ownership authorization.
 *
 * This middleware checks if the authenticated user is the creator of the specified
 * resource. It queries the repository using the provided lookup function to fetch
 * the resource and verify the createdBy field matches the authenticated user's ID.
 *
 * Prerequisites:
 * - Must be used AFTER the `authenticate` middleware
 * - Requires a resourceId route parameter (customizable via resourceIdParam)
 * - The lookupFn must return a resource object with a createdBy field
 *
 * Usage example:
 * ```typescript
 * const taskRepo = container.resolve(TaskRepository);
 *
 * router.put(
 *   '/tasks/:taskId',
 *   authenticate,
 *   authorizeCreatorOwnership({
 *     resourceIdParam: 'taskId',
 *     lookupFn: async (id) => {
 *       const task = await taskRepo.findById(id);
 *       return task ? { createdBy: task.createdBy } : null;
 *     }
 *   }),
 *   updateTaskHandler
 * );
 * ```
 *
 * @param options - Authorization options
 * @returns Express middleware function
 */
export function authorizeCreatorOwnership(
  options: AuthorizeCreatorOwnershipOptions,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const { resourceIdParam = "resourceId", lookupFn } = options;

  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;

      // Ensure user is authenticated
      if (!authReq.user) {
        throw HttpError.unauthorized("Authentication required");
      }

      // Extract resourceId from route parameters
      const resourceIdStr = req.params[resourceIdParam];
      if (!resourceIdStr) {
        throw HttpError.badRequest(
          `Missing required parameter: ${resourceIdParam}`,
        );
      }

      // Validate resourceId format
      if (!ObjectId.isValid(resourceIdStr)) {
        throw HttpError.badRequest(`Invalid ${resourceIdParam} format`);
      }

      const resourceId = new ObjectId(resourceIdStr);
      const userId = new ObjectId(authReq.user.id);

      // Check creator ownership authorization
      await requireCreatorOwnership({
        userId,
        resourceId,
        lookupFn,
      });

      // Authorization successful - continue to route handler
      next();
    } catch (error) {
      next(error);
    }
  };
}
