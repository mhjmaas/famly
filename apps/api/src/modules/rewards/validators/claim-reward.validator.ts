import { HttpError } from "@lib/http-error";
import { ObjectId } from "mongodb";

/**
 * Validate reward claim request input
 * @param rewardId - The reward ID from URL parameter
 * @throws HttpError with 400 if validation fails
 */
export function validateClaimReward(rewardId: string): ObjectId {
  if (!rewardId || typeof rewardId !== "string") {
    throw HttpError.badRequest("Reward ID is required");
  }

  if (!ObjectId.isValid(rewardId)) {
    throw HttpError.badRequest("Invalid reward ID format");
  }

  return new ObjectId(rewardId);
}
