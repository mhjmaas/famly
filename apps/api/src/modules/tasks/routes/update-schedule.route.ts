import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { toTaskScheduleDTO } from "../lib/task-schedule.mapper";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { ScheduleService } from "../services/schedule.service";
import { validateUpdateSchedule } from "../validators/update-schedule.validator";

/**
 * PATCH /schedules/:scheduleId - Update a schedule
 *
 * Requires authentication and family membership
 *
 * Request body (all fields optional):
 * - name?: string
 * - description?: string
 * - assignment?: TaskAssignment
 * - schedule?: Schedule
 * - timeOfDay?: string
 *
 * Response (200): TaskScheduleDTO
 * Response (400): Validation error or invalid schedule ID
 * Response (401): Authentication required
 * Response (403): Not a family member or schedule belongs to different family
 * Response (404): Schedule not found
 */
export function createUpdateScheduleRoute(): Router {
  const router = Router({ mergeParams: true });
  const scheduleRepository = new ScheduleRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const scheduleService = new ScheduleService(
    scheduleRepository,
    membershipRepository,
  );

  router.patch(
    "/schedules/:scheduleId",
    authenticate,
    validateUpdateSchedule,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        if (!req.params.scheduleId) {
          throw HttpError.badRequest("Missing scheduleId parameter");
        }

        // Validate scheduleId format
        validateObjectId(req.params.scheduleId);

        const familyId = req.params.familyId;
        const scheduleId = req.params.scheduleId;

        const schedule = await scheduleService.updateSchedule(
          familyId,
          scheduleId,
          userId,
          req.body,
        );

        res.status(200).json(toTaskScheduleDTO(schedule));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
