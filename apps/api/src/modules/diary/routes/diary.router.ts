import { Router } from "express";
import { createEntryRoute } from "./create-entry.route";
import { deleteEntryRoute } from "./delete-entry.route";
import { getEntryRoute } from "./get-entry.route";
import { listEntriesRoute } from "./list-entries.route";
import { updateEntryRoute } from "./update-entry.route";

/**
 * Create the main diary router that combines all route handlers
 *
 * Routes:
 * - POST /v1/diary - Create a new diary entry
 * - GET /v1/diary - List all user's diary entries
 * - GET /v1/diary/:entryId - Get a specific diary entry
 * - PATCH /v1/diary/:entryId - Update a diary entry
 * - DELETE /v1/diary/:entryId - Delete a diary entry
 */
export function createDiaryRouter(): Router {
  const router = Router();

  // Mount create entry route (POST /)
  router.use(createEntryRoute());

  // Mount list entries route (GET /)
  router.use(listEntriesRoute());

  // Mount get entry route (GET /:entryId)
  router.use(getEntryRoute());

  // Mount update entry route (PATCH /:entryId)
  router.use(updateEntryRoute());

  // Mount delete entry route (DELETE /:entryId)
  router.use(deleteEntryRoute());

  return router;
}
