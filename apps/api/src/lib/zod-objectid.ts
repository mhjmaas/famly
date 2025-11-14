import { z } from "zod";
import { isValidObjectId, type ObjectIdString } from "./objectid-utils";

/**
 * Zod schema for validating ObjectId strings
 * Replaces all instances of z.string().refine(ObjectId.isValid)
 */
export const zodObjectId = z
  .string()
  .refine(isValidObjectId, {
    message: "Invalid ObjectId format",
  })
  .transform((value) => value as ObjectIdString);

/**
 * Zod schema for validating arrays of ObjectId strings
 */
export const zodObjectIdArray = z.array(zodObjectId);
