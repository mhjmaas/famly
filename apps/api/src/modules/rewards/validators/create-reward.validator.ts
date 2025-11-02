import { HttpError } from "@lib/http-error";
import type { CreateRewardInput } from "../domain/reward";

/**
 * Validate reward creation input
 * @param input - The input to validate
 * @throws HttpError with 400 if validation fails
 */
export function validateCreateReward(input: unknown): CreateRewardInput {
  if (!input || typeof input !== "object") {
    throw HttpError.badRequest("Invalid reward input");
  }

  const data = input as Record<string, unknown>;

  // Validate name
  if (typeof data.name !== "string" || !data.name.trim()) {
    throw HttpError.badRequest("Reward name is required");
  }

  const name = data.name.trim();
  if (name.length < 1 || name.length > 100) {
    throw HttpError.badRequest(
      "Reward name must be between 1 and 100 characters",
    );
  }

  // Validate karmaCost
  if (typeof data.karmaCost !== "number") {
    throw HttpError.badRequest(
      "Reward karmaCost is required and must be a number",
    );
  }

  if (!Number.isInteger(data.karmaCost)) {
    throw HttpError.badRequest("Reward karmaCost must be an integer");
  }

  if (data.karmaCost < 1 || data.karmaCost > 1000) {
    throw HttpError.badRequest("Reward karmaCost must be between 1 and 1000");
  }

  // Validate description (optional)
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== "string") {
      throw HttpError.badRequest("Reward description must be a string");
    }

    if (data.description.length > 500) {
      throw HttpError.badRequest(
        "Reward description must not exceed 500 characters",
      );
    }
  }

  // Validate imageUrl (optional)
  if (data.imageUrl !== undefined && data.imageUrl !== null) {
    if (typeof data.imageUrl !== "string") {
      throw HttpError.badRequest("Reward imageUrl must be a string");
    }

    if (data.imageUrl.length > 500) {
      throw HttpError.badRequest(
        "Reward imageUrl must not exceed 500 characters",
      );
    }

    // Validate URL format
    try {
      const url = new URL(data.imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      throw HttpError.badRequest("Reward imageUrl must be a valid HTTP(S) URL");
    }
  }

  return {
    name,
    karmaCost: data.karmaCost,
    description: data.description as string | undefined,
    imageUrl: data.imageUrl as string | undefined,
  };
}
