import { Router } from "express";
import { createFamilyDiaryCreateEntryRoute } from "./family/create-entry.route";
import { createFamilyDiaryDeleteEntryRoute } from "./family/delete-entry.route";
import { createFamilyDiaryGetEntryRoute } from "./family/get-entry.route";
import { createFamilyDiaryListEntriesRoute } from "./family/list-entries.route";
import { createFamilyDiaryUpdateEntryRoute } from "./family/update-entry.route";

/**
 * Create the family diary router that combines all family diary route handlers
 *
 * Routes (mounted at /v1/families/:familyId/diary):
 * - POST / - Create a new family diary entry
 * - GET / - List all family's diary entries
 * - GET /:entryId - Get a specific family diary entry
 * - PATCH /:entryId - Update a family diary entry
 * - DELETE /:entryId - Delete a family diary entry
 */
export function createFamilyDiaryRouter(): Router {
  const router = Router({ mergeParams: true }); // CRITICAL: mergeParams to access :familyId from parent routers

  // Mount create entry route (POST /)
  router.use(createFamilyDiaryCreateEntryRoute());

  // Mount list entries route (GET /)
  router.use(createFamilyDiaryListEntriesRoute());

  // Mount get entry route (GET /:entryId)
  router.use(createFamilyDiaryGetEntryRoute());

  // Mount update entry route (PATCH /:entryId)
  router.use(createFamilyDiaryUpdateEntryRoute());

  // Mount delete entry route (DELETE /:entryId)
  router.use(createFamilyDiaryDeleteEntryRoute());

  return router;
}
