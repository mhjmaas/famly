import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { TaskRepository } from "../repositories/task.repository";
import { TaskService } from "../services/task.service";

/**
 * DELETE /:taskId - Delete a task
 *
 * Requires authentication and family membership
 *
 * Response (204): Task deleted successfully (no content)
 * Response (400): Invalid task ID format
 * Response (401): Authentication required
 * Response (403): Not a family member or task belongs to different family
 * Response (404): Task not found
 */
export function createDeleteTaskRoute(): Router {
  const router = Router({ mergeParams: true });
  const taskRepository = new TaskRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const taskService = new TaskService(taskRepository, membershipRepository);

  router.delete(
    "/:taskId",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.taskId) {
          throw HttpError.badRequest("Missing taskId parameter");
        }

        // Validate taskId format
        validateObjectId(req.params.taskId);

        const familyId = req.params.familyId;
        const taskId = req.params.taskId;

        await taskService.deleteTask(familyId, taskId, userId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
