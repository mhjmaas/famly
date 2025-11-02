import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toTaskDTO } from "../lib/task.mapper";
import { getTaskService } from "../services/task.service.instance";
import { validateUpdateTask } from "../validators/update-task.validator";

/**
 * PATCH /:taskId - Update a task
 *
 * Requires authentication and family membership
 *
 * Request body (all fields optional):
 * - name?: string
 * - description?: string
 * - dueDate?: Date
 * - assignment?: TaskAssignment
 * - completedAt?: Date | null
 * - metadata?: { karma?: number }
 *
 * Response (200): TaskDTO
 * Response (400): Validation error or invalid task ID
 * Response (401): Authentication required
 * Response (403): Not a family member or task belongs to different family
 * Response (404): Task not found
 */
export function createUpdateTaskRoute(): Router {
  const router = Router({ mergeParams: true });
  const taskService = getTaskService();

  router.patch(
    "/:taskId",
    authenticate,
    validateUpdateTask,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = new ObjectId(req.user.id);

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.taskId) {
          throw HttpError.badRequest("Missing taskId parameter");
        }

        // Validate taskId format
        if (!ObjectId.isValid(req.params.taskId)) {
          throw HttpError.badRequest("Invalid taskId format");
        }

        const familyId = new ObjectId(req.params.familyId);
        const taskId = new ObjectId(req.params.taskId);

        const task = await taskService.updateTask(
          familyId,
          taskId,
          userId,
          req.body,
        );

        res.status(200).json(toTaskDTO(task));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
