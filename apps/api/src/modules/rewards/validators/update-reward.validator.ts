import { HttpError } from "@lib/http-error";
import type { UpdateRewardInput } from "../domain/reward";

/**
 * Validate reward update input
 * @param input - The input to validate
 * @throws HttpError with 400 if validation fails
 */
export function validateUpdateReward(input: unknown): UpdateRewardInput {
  if (!input || typeof input !== "object") {
    throw HttpError.badRequest("Invalid reward input");
  }

  const data = input as Record<string, unknown>;
  const result: UpdateRewardInput = {};

  // Validate name (optional)
  if (data.name !== undefined && data.name !== null) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      throw HttpError.badRequest("Reward name must be a non-empty string");
    }

    const name = data.name.trim();
    if (name.length < 1 || name.length > 100) {
      throw HttpError.badRequest(
        "Reward name must be between 1 and 100 characters",
      );
    }

    result.name = name;
  }

  // Validate karmaCost (optional)
  if (data.karmaCost !== undefined && data.karmaCost !== null) {
    if (typeof data.karmaCost !== "number") {
      throw HttpError.badRequest("Reward karmaCost must be a number");
    }

    if (!Number.isInteger(data.karmaCost)) {
      throw HttpError.badRequest("Reward karmaCost must be an integer");
    }

    if (data.karmaCost < 1 || data.karmaCost > 1000) {
      throw HttpError.badRequest("Reward karmaCost must be between 1 and 1000");
    }

    result.karmaCost = data.karmaCost;
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

    result.description = data.description;
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

    // Validate URL format - accept either full HTTP(S) URLs or relative paths from upload
    const isRelativePath = data.imageUrl.startsWith("/api/images/");
    if (!isRelativePath) {
      try {
        const url = new URL(data.imageUrl);
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Invalid protocol");
        }
      } catch {
        throw HttpError.badRequest(
          "Reward imageUrl must be a valid HTTP(S) URL or a relative path starting with /api/images/",
        );
      }
    }

    result.imageUrl = data.imageUrl;
  }

  return result;
}
