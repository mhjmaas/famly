import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { toTaskScheduleDTO } from "../lib/task-schedule.mapper";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { ScheduleService } from "../services/schedule.service";

/**
 * GET /schedules - List all schedules for a family
 *
 * Requires authentication and family membership
 *
 * Response (200): TaskScheduleDTO[]
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function createListSchedulesRoute(): Router {
  const router = Router({ mergeParams: true });
  const scheduleRepository = new ScheduleRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const scheduleService = new ScheduleService(
    scheduleRepository,
    membershipRepository,
  );

  router.get(
    "/schedules",
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

        const schedules = await scheduleService.listSchedulesForFamily(
          familyId,
          userId,
        );

        res.status(200).json(schedules.map(toTaskScheduleDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
