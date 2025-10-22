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
 * GET /:taskId - Get a specific task by ID
 *
 * Requires authentication and family membership
 *
 * Response (200): TaskDTO
 * Response (400): Invalid task ID format
 * Response (401): Authentication required
 * Response (403): Not a family member or task belongs to different family
 * Response (404): Task not found
 */
export function createGetTaskRoute(): Router {
  const router = Router({ mergeParams: true });
  const taskRepository = new TaskRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const taskService = new TaskService(taskRepository, membershipRepository);

  router.get(
    "/:taskId",
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

        if (!req.params.taskId) {
          throw HttpError.badRequest("Missing taskId parameter");
        }

        // Validate taskId format
        if (!ObjectId.isValid(req.params.taskId)) {
          throw HttpError.badRequest("Invalid taskId format");
        }

        const familyId = new ObjectId(req.params.familyId);
        const taskId = new ObjectId(req.params.taskId);

        const task = await taskService.getTaskById(familyId, taskId, userId);

        res.status(200).json(toTaskDTO(task));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
