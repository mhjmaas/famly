import { ObjectId } from "mongodb";
import { HttpError } from "./http-error";

declare const objectIdBrand: unique symbol;

export type ObjectIdString = string & { readonly [objectIdBrand]: true };

function invalidObjectId(context: string): HttpError {
  return HttpError.badRequest(`Invalid ObjectId format for ${context}`);
}

/**
 * Validates if a string is a valid ObjectId format
 */
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

/**
 * Validates an ObjectId string and returns it, throws if invalid
 */
export function validateObjectId(
  id: string,
  context: string = "id",
): ObjectIdString {
  if (!ObjectId.isValid(id)) {
    throw invalidObjectId(context);
  }
  return id as ObjectIdString;
}

/**
 * Validates an array of ObjectId strings, throws if any are invalid
 */
export function validateObjectIdArray(
  ids: string[],
  context: string = "ids",
): ObjectIdString[] {
  return ids.map((id, index) => validateObjectId(id, `${context}[${index}]`));
}

/**
 * Converts a string ID to an ObjectId for repository queries
 * Use this at the repository boundary
 */
export function toObjectId(id: string, context: string = "id"): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw invalidObjectId(context);
  }
  return new ObjectId(id);
}

/**
 * Converts an array of string IDs to ObjectIds for repository queries
 */
export function toObjectIdArray(
  ids: string[],
  context: string = "ids",
): ObjectId[] {
  return ids.map((id, index) => toObjectId(id, `${context}[${index}]`));
}

/**
 * Converts an ObjectId to a string for DTOs
 * Use this when mapping domain objects to DTOs
 */
export function fromObjectId(id: ObjectId): ObjectIdString {
  return id.toString() as ObjectIdString;
}

/**
 * Converts an array of ObjectIds to strings for DTOs
 */
export function fromObjectIdArray(ids: ObjectId[]): ObjectIdString[] {
  return ids.map((id) => fromObjectId(id));
}

/**
 * Compares two ObjectIds for equality
 * Helper for when you still have ObjectId objects that need comparison
 */
export function compareObjectIds(a: ObjectId, b: ObjectId): boolean {
  return a.toString() === b.toString();
}
