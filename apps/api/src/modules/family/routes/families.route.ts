import { createTasksRouter } from "@modules/tasks";
import { Router } from "express";
import { createAddMemberRoute } from "./add-member.route";
import { createCreateFamilyRoute } from "./create-family.route";
import { createListFamiliesRoute } from "./list-families.route";
import { createRemoveMemberRoute } from "./remove-member.route";

/**
 * Create families router with all family-related endpoints
 *
 * Routes:
 * - POST /v1/families - Create a new family
 * - GET /v1/families - List families for authenticated user
 * - POST /v1/families/:familyId/members - Add a member to a family
 * - DELETE /v1/families/:familyId/members/:memberId - Remove a member from a family
 * - GET/POST /v1/families/:familyId/tasks/* - Tasks endpoints (mounted via createTasksRouter)
 */
export function createFamiliesRouter(): Router {
  const router = Router();

  // Custom routes for family management
  router.use(createCreateFamilyRoute());
  router.use(createListFamiliesRoute());
  router.use(createAddMemberRoute());
  router.use(createRemoveMemberRoute());

  // Mount tasks router for /:familyId/tasks/* paths
  // This must be after other routes to avoid conflicts
  router.use("/:familyId/tasks", createTasksRouter());

  return router;
}
