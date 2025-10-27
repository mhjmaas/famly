import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { Router } from "express";
import { KarmaRepository } from "../repositories/karma.repository";
import { KarmaService } from "../services/karma.service";
import { createGetBalanceRoute } from "./get-balance.route";
import { createGetHistoryRoute } from "./get-history.route";
import { createGrantKarmaRoute } from "./grant-karma.route";

/**
 * Karma router
 *
 * Mounts all karma-related routes under /v1/families/:familyId/karma
 *
 * All routes require authentication
 */
export function createKarmaRouter(): Router {
  const router = Router({ mergeParams: true });

  // Initialize dependencies
  const karmaRepository = new KarmaRepository();
  const membershipRepository = new FamilyMembershipRepository();
  const karmaService = new KarmaService(karmaRepository, membershipRepository);

  // Apply authentication to all routes
  router.use(authenticate);

  // Mount routes
  router.use("/balance", createGetBalanceRoute(karmaService));
  router.use("/history", createGetHistoryRoute(karmaService));
  router.use("/grant", createGrantKarmaRoute(karmaService));

  return router;
}
