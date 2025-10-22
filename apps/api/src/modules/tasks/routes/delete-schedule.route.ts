import { HttpError } from "@lib/http-error";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { ObjectId } from "mongodb";
import { ScheduleRepository } from "../repositories/schedule.repository";
import { ScheduleService } from "../services/schedule.service";

/**
 * DELETE /schedules/:scheduleId - Delete a schedule
 *
 * Requires authentication and family membership
 *
 * Response (204): Schedule deleted successfully (no content)
 * Response (400): Invalid schedule ID format
 * Response (401): Authentication required
 * Response (403): Not a family member or schedule belongs to different family
 * Response (404): Schedule not found
 */
export function createDeleteScheduleRoute(): Router {
  const router = Router({ mergeParams: true });
  const scheduleRepository = new ScheduleRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const scheduleService = new ScheduleService(
    scheduleRepository,
    membershipRepository,
  );

  router.delete(
    "/schedules/:scheduleId",
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

        if (!req.params.scheduleId) {
          throw HttpError.badRequest("Missing scheduleId parameter");
        }

        // Validate scheduleId format
        if (!ObjectId.isValid(req.params.scheduleId)) {
          throw HttpError.badRequest("Invalid scheduleId format");
        }

        const familyId = new ObjectId(req.params.familyId);
        const scheduleId = new ObjectId(req.params.scheduleId);

        await scheduleService.deleteSchedule(familyId, scheduleId, userId);

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
