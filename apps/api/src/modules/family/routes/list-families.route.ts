import { getDb } from "@infra/mongo/client";
import { HttpError } from "@lib/http-error";
import { logger } from "@lib/logger";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import {
  buildFamiliesWithMembersResponse,
  type FamiliesWithMembersResponse,
} from "../lib/family.mapper";
import { FamilyRepository } from "../repositories/family.repository";
import { FamilyMembershipRepository } from "../repositories/family-membership.repository";
import { FamilyService } from "../services/family.service";

/**
 * List families route
 *
 * GET /v1/families - List families for authenticated user
 *
 * Requires authentication
 * Returns all families the user belongs to with their roles
 *
 * Response (200): FamilyMembershipView[]
 *
 * Response (401): Authentication required
 */
export function createListFamiliesRoute(): Router {
  const router = Router();

  const familyRepository = new FamilyRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const familyService = new FamilyService(
    familyRepository,
    membershipRepository,
  );

  router.get(
    "/",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        const userId = req.user.id;

        logger.debug("Listing families via API", {
          userId,
        });

        const families = await familyService.listFamiliesForUser(userId);

        if (families.length === 0) {
          res.status(200).json([]);
          return;
        }

        const familyIds = families.map((family) => family.familyId);
        const memberships =
          await membershipRepository.findByFamilyIds(familyIds);

        // Fetch user details for all members to include name and birthdate
        const db = getDb();
        const usersCollection = db.collection("user");

        const userIds = memberships.map((m) => m.userId);
        const users = await usersCollection
          .find({ _id: { $in: userIds } })
          .toArray();

        // Create a map of user ID to user data
        const userMap = new Map(
          users.map((u) => [
            u._id.toString(),
            { name: u.name as string, birthdate: u.birthdate as string | Date },
          ]),
        );

        // Add user data to memberships for the mapper
        const membershipsWithUsers = memberships.map((m) => ({
          ...m,
          user: userMap.get(m.userId.toString()),
        }));

        const familiesWithMembers: FamiliesWithMembersResponse =
          buildFamiliesWithMembersResponse(families, membershipsWithUsers);

        res.status(200).json(familiesWithMembers);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
