import { HttpError } from "@lib/http-error";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { FamilyRole } from "../domain/family";

/**
 * Zod schema for add family member payload validation
 *
 * Validates:
 * - email: Valid email format, normalized to lowercase
 * - password: Minimum 8 characters (better-auth will enforce additional rules)
 * - role: Must be either Parent or Child
 */
export const addFamilyMemberSchema = z.object({
	email: z.preprocess(
		(val) => (typeof val === "string" ? val.trim().toLowerCase() : val),
		z
			.string()
			.min(1, "Email is required")
			.email("Invalid email format")
			.max(255, "Email cannot exceed 255 characters"),
	),

	password: z
		.string()
		.min(1, "Password is required")
		.min(8, "Password must be at least 8 characters"),

	role: z
		.nativeEnum(FamilyRole)
		.refine((val) => val === FamilyRole.Parent || val === FamilyRole.Child, {
			message: "Role must be either Parent or Child",
		}),
});

export type AddFamilyMemberPayload = z.infer<typeof addFamilyMemberSchema>;

/**
 * Express middleware to validate add family member request body
 */
export function validateAddFamilyMember(
	req: Request,
	_res: Response,
	next: NextFunction,
): void {
	try {
		// Validate and transform request body
		const validated = addFamilyMemberSchema.parse(req.body);

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
