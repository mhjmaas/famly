import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import {
  ActivityEventRepository,
  ActivityEventService,
} from "@modules/activity-events";
import { toActivityEventDTO } from "@modules/activity-events/lib/activity-event.mapper";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { authorizeFamilyRole } from "@modules/auth/middleware/authorize-family-role";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import { FamilyRole } from "../domain/family";
import { validateGetFamilyMemberActivityEventsParams } from "../validators/get-family-member-activity-events.validator";

/**
 * GET /:familyId/members/:memberId/activity-events - Get activity events for a specific family member
 *
 * Requires:
 * - Authentication
 * - Family membership (both Parent and Child roles can access)
 *
 * Path parameters:
 * - familyId: string (ObjectId format)
 * - memberId: string (ObjectId format) - the family member ID whose events to retrieve
 *
 * Query parameters (optional):
 * - startDate: string (format: YYYY-MM-DD) - filter events from this date
 * - endDate: string (format: YYYY-MM-DD) - filter events until this date
 *
 * Response (200): Array of ActivityEventDTO (up to 100 events, sorted by most recent first)
 * Response (400): Invalid memberId or date parameters
 * Response (401): Authentication required
 * Response (403): Not a member of the specified family
 * Response (404): Family member not found
 */
export function createGetFamilyMemberActivityEventsRoute(): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :familyId from parent router
  const activityEventRepository = new ActivityEventRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const activityEventService = new ActivityEventService(
    activityEventRepository,
    membershipRepository,
  );

  router.get(
    "/members/:memberId/activity-events",
    authenticate,
    authorizeFamilyRole({
      allowedRoles: [FamilyRole.Parent, FamilyRole.Child],
    }),
    validateGetFamilyMemberActivityEventsParams,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const requestingUserId = validateObjectId(req.user.id, "userId");
        const familyId = req.params.familyId as string;
        const memberId = req.params.memberId as string;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;

        const events = await activityEventService.getEventsForFamilyMember(
          requestingUserId,
          familyId,
          memberId,
          startDate,
          endDate,
        );

        res.status(200).json(events.map(toActivityEventDTO));
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
