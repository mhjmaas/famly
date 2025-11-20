import { Router } from "express";
import { addDeductionRoute } from "./add-deduction.route";
import { createContributionGoalRoute } from "./create-contribution-goal.route";
import { deleteContributionGoalRoute } from "./delete-contribution-goal.route";
import { getContributionGoalRoute } from "./get-contribution-goal.route";
import { updateContributionGoalRoute } from "./update-contribution-goal.route";

/**
 * Create and configure the contribution goals router
 * Mounted at /families/:familyId/contribution-goals
 */
export function createContributionGoalsRouter(): Router {
  const router = Router({ mergeParams: true });

  // Register all routes
  router.use("/", createContributionGoalRoute());
  router.use("/", getContributionGoalRoute());
  router.use("/", updateContributionGoalRoute());
  router.use("/", deleteContributionGoalRoute());
  router.use("/", addDeductionRoute());

  return router;
}
