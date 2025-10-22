import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toTaskDTO } from "../lib/task.mapper";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";
import { validateCreateTask } from "../validators/create-task.validator";

/**
 * POST /tasks - Create a new task
 *
 * Requires authentication and family membership
 *
 * Request body:
 * - name: string (required, max 200 chars)
 * - description?: string (optional, max 2000 chars)
 * - dueDate?: Date (optional, ISO 8601 format)
 * - assignment: TaskAssignment (required)
 *
 * Response (201): TaskDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createTaskRoute(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers
  const taskRepository = new TaskRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const taskService = new TaskService(taskRepository, membershipRepository);

  router.post(
    "/",
    authenticate,
    validateCreateTask,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

        // Validate familyId parameter exists (critical for nested routers)
        if (!req.params.familyId) {
          logger.error("familyId parameter missing from request", {
            params: req.params,
            path: req.path,
            baseUrl: req.baseUrl,
          });
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = new ObjectId(req.params.familyId);

        const task = await taskService.createTask(familyId, userId, req.body);

        res.status(201).json(toTaskDTO(task));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
