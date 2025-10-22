import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toTaskDTO } from "../lib/task.mapper";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";

/**
 * GET /tasks - List all tasks for a family
 *
 * Requires authentication and family membership
 *
 * Query parameters:
 * - dueDateFrom?: ISO 8601 date string (optional)
 * - dueDateTo?: ISO 8601 date string (optional)
 *
 * Response (200): TaskDTO[]
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createListTasksRoute(): Router {
  const router = Router({ mergeParams: true });
  const taskRepository = new TaskRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const taskService = new TaskService(taskRepository, membershipRepository);

  router.get(
    "/",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = new ObjectId(req.params.familyId);

        // Parse optional date range query parameters
        let dueDateFrom: Date | undefined;
        let dueDateTo: Date | undefined;

        if (req.query.dueDateFrom) {
          dueDateFrom = new Date(req.query.dueDateFrom as string);
          if (Number.isNaN(dueDateFrom.getTime())) {
            throw HttpError.badRequest("Invalid dueDateFrom format");
          }
        }

        if (req.query.dueDateTo) {
          dueDateTo = new Date(req.query.dueDateTo as string);
          if (Number.isNaN(dueDateTo.getTime())) {
            throw HttpError.badRequest("Invalid dueDateTo format");
          }
        }

        const tasks = await taskService.listTasksForFamily(
          familyId,
          userId,
          dueDateFrom,
          dueDateTo,
        );

        res.status(200).json(tasks.map(toTaskDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
