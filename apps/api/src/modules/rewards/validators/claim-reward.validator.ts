import { HttpError } from "@lib/http-error";
import { type ObjectIdString, validateObjectId } from "@lib/objectid-utils";

/**
 * Validate reward claim request input
 * @param rewardId - The reward ID from URL parameter
 * @throws HttpError with 400 if validation fails
 */
export function validateClaimReward(rewardId: string): ObjectIdString {
  if (!rewardId || typeof rewardId !== "string") {
    throw HttpError.badRequest("Reward ID is required");
  }

  return validateObjectId(rewardId, "rewardId");
}
