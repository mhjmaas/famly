import { Router } from "express";
import { createScheduleRoute } from "./create-schedule.route";
import { createTaskRoute } from "./create-task.route";
import { createDeleteScheduleRoute } from "./delete-schedule.route";
import { createDeleteTaskRoute } from "./delete-task.route";
import { createGetScheduleRoute } from "./get-schedule.route";
import { createGetTaskRoute } from "./get-task.route";
import { createListSchedulesRoute } from "./list-schedules.route";
import { createListTasksRoute } from "./list-tasks.route";
import { createUpdateScheduleRoute } from "./update-schedule.route";
import { createUpdateTaskRoute } from "./update-task.route";

/**
 * Create tasks router for /v1/families/:familyId/tasks
 *
 * All routes are scoped to a specific family via the familyId parameter
 */
export function createTasksRouter(): Router {
  const router = Router({ mergeParams: true }); // mergeParams to access :familyId from parent router

  // Schedule routes (must come before parameterized task routes to avoid conflicts)
  router.use(createScheduleRoute());
  router.use(createListSchedulesRoute());
  router.use(createGetScheduleRoute());
  router.use(createUpdateScheduleRoute());
  router.use(createDeleteScheduleRoute());

  // Task routes
  router.use(createTaskRoute());
  router.use(createListTasksRoute());
  router.use(createGetTaskRoute());
  router.use(createUpdateTaskRoute());
  router.use(createDeleteTaskRoute());

  return router;
}
