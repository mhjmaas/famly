import { Router } from "express";
import { cancelClaimRoute } from "./cancel-claim.route";
import { claimRewardRoute } from "./claim-reward.route";
import { createRewardRoute } from "./create-reward.route";
import { deleteRewardRoute } from "./delete-reward.route";
import { getClaimRoute } from "./get-claim.route";
import { getRewardRoute } from "./get-reward.route";
import { listClaimsRoute } from "./list-claims.route";
import { listRewardsRoute } from "./list-rewards.route";
import { toggleFavouriteRoute } from "./toggle-favourite.route";
import { updateRewardRoute } from "./update-reward.route";
import { uploadImageRoute } from "./upload-image.route";

/**
 * Main rewards router
 * Combines all reward and claim endpoints
 * Mounted at /v1/families/:familyId
 *
 * Each route file defines its own full path (e.g., /rewards, /rewards/:rewardId, /claims)
 * Order matters: Specific routes must be registered before parameterized routes
 */
export function rewardsRouter(): Router {
  const router = Router({ mergeParams: true });

  // Reward routes - order matters! More specific paths before parameterized ones
  router.use(uploadImageRoute()); // POST /rewards/upload-image
  router.use(createRewardRoute()); // POST /rewards
  router.use(listRewardsRoute()); // GET /rewards
  router.use(claimRewardRoute()); // POST /rewards/:rewardId/claim
  router.use(toggleFavouriteRoute()); // POST /rewards/:rewardId/favourite
  router.use(updateRewardRoute()); // PATCH /rewards/:rewardId
  router.use(deleteRewardRoute()); // DELETE /rewards/:rewardId
  router.use(getRewardRoute()); // GET /rewards/:rewardId

  // Claim routes
  router.use(listClaimsRoute()); // GET /claims
  router.use(getClaimRoute()); // GET /claims/:claimId
  router.use(cancelClaimRoute()); // DELETE /claims/:claimId

  return router;
}
