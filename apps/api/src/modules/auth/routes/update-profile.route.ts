import { getDb } from "@infra/mongo/client";
import { type NextFunction, type Response, Router } from "express";
import { ObjectId } from "mongodb";
import {
  type AuthenticatedRequest,
  authenticate,
} from "../middleware/authenticate";
import {
  type UpdateProfileRequest,
  updateProfileSchema,
} from "../validators/update-profile.validator";

/**
 * Update current user profile endpoint.
 *
 * Allows authenticated users to update their name and birthdate.
 * Email updates are not supported to maintain authentication integrity.
 *
 * Request headers:
 * - Cookie: session=<session-token> (for web)
 * - Authorization: Bearer <token> (for mobile/API)
 *
 * Request body:
 * - name: string (required, 1-100 characters)
 * - birthdate: string (required, YYYY-MM-DD format)
 *
 * Response (200):
 * - user: Updated user object
 *
 * Response (400): Validation error
 * Response (401): Unauthorized
 * Response (500): Server error
 */
export function createUpdateProfileRoute(): Router {
  const router = Router();

  router.patch(
    "/me",
    authenticate,
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // Validate request body
        const validation = updateProfileSchema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({
            error: "Validation failed",
            details: validation.error.format(),
          });
        }

        const { name, birthdate }: UpdateProfileRequest = validation.data;

        // User is guaranteed to exist due to authenticate middleware
        if (!req.user) {
          return res.status(500).json({ error: "User not found in request" });
        }

        const db = getDb();
        const usersCollection = db.collection("user");

        // Update user in database
        const updateResult = await usersCollection.updateOne(
          { _id: new ObjectId(req.user.id) },
          {
            $set: {
              name,
              birthdate: new Date(birthdate),
              updatedAt: new Date(),
            },
          },
        );

        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ error: "User not found" });
        }

        // Fetch updated user
        const updatedUser = await usersCollection.findOne({
          _id: new ObjectId(req.user.id),
        });

        if (!updatedUser) {
          return res.status(500).json({ error: "Failed to fetch updated user" });
        }

        res.status(200).json({
          user: {
            id: updatedUser._id.toString(),
            email: updatedUser.email,
            name: updatedUser.name,
            birthdate: updatedUser.birthdate,
            emailVerified: updatedUser.emailVerified,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
            families: req.user.families || [],
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
