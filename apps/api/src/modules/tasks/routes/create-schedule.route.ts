import { HttpError } from "@lib/http-error";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toTaskScheduleDTO } from "../lib/task-schedule.mapper";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { TaskRepository } from "../repositories/task.repository";
import { ScheduleService } from "../services/schedule.service";
import { TaskGeneratorService } from "../services/task-generator.service";
import { validateCreateSchedule } from "../validators/create-schedule.validator";

/**
 * POST /schedules - Create a new task schedule
 *
 * Requires authentication and family membership
 *
 * Request body:
 * - name: string (required, max 200 chars)
 * - description?: string (optional, max 2000 chars)
 * - daysOfWeek: number[] (required, 0-6, at least one)
 * - weeklyInterval: number (required, 1-4)
 * - startDate?: Date (optional, ISO 8601 format)
 * - endDate?: Date (optional, ISO 8601 format)
 * - assignment: TaskAssignment (required)
 *
 * Response (201): ScheduleDTO
 * Response (400): Validation error
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createScheduleRoute(): Router {
  const router = Router({ mergeParams: true });
  const scheduleRepository = new ScheduleRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const activityEventRepository = new ActivityEventRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
  );
  const taskRepository = new TaskRepository();
  const taskGeneratorService = new TaskGeneratorService(
    taskRepository,
    scheduleRepository,
  );
  const scheduleService = new ScheduleService(
    scheduleRepository,
    membershipRepository,
    activityEventService,
    taskGeneratorService,
  );

  router.post(
    "/schedules",
    authenticate,
    validateCreateSchedule,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        const familyId = req.params.familyId;

        const schedule = await scheduleService.createSchedule(
          familyId,
          userId,
          req.body,
        );

        res.status(201).json(toTaskScheduleDTO(schedule));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
