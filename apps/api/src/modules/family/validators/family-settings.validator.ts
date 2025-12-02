import { ALL_FEATURES, type FeatureKey } from "@famly/shared";
import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

/**
 * Zod schema for AI settings
 */
const aiSettingsSchema = z
  .object({
    apiEndpoint: z.string().url("API endpoint must be a valid URL").min(1),
    apiSecret: z.string().optional(),
    modelName: z.string().min(1, "Model name is required"),
    aiName: z.string().min(1, "AI name is required"),
    provider: z.enum(["LM Studio", "Ollama"] as const, {
      message: 'Provider must be one of: "LM Studio" or "Ollama"',
    }),
  })
  .optional();

/**
 * Zod schema for update family settings payload
 */
export const updateFamilySettingsSchema = z.object({
  enabledFeatures: z
    .array(z.enum(ALL_FEATURES as unknown as [FeatureKey, ...FeatureKey[]]))
    .min(0, "Enabled features must be an array")
    .max(
      ALL_FEATURES.length,
      `Cannot enable more than ${ALL_FEATURES.length} features`,
    )
    .refine(
      (features) => {
        // Check for duplicates
        const uniqueFeatures = new Set(features);
        return uniqueFeatures.size === features.length;
      },
      { message: "Enabled features must not contain duplicates" },
    ),
  aiSettings: aiSettingsSchema,
});

export type UpdateFamilySettingsPayload = z.infer<
  typeof updateFamilySettingsSchema
>;

/**
 * Express middleware to validate update family settings request body
 */
export function validateUpdateFamilySettings(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    // Validate and transform request body
    const validated = updateFamilySettingsSchema.parse(req.body);

    // Replace request body with validated data
    req.body = validated;

    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      throw HttpError.badRequest(firstError.message);
    }
    throw error;
  }
}
