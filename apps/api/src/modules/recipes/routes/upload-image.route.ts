import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import multer from "multer";
import {
  uploadRecipeImage,
  validateFileSize,
  validateFileType,
} from "../services/upload.service";

/**
 * Configure multer for memory storage
 * Files are stored in memory as buffers and uploaded to MinIO
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    // Validate file type
    if (!validateFileType(file.mimetype)) {
      cb(
        HttpError.badRequest(
          "Only JPEG, PNG, GIF, and WebP images are allowed",
        ) as unknown as Error,
      );
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /recipes/upload-image - Upload an image for a recipe
 *
 * Requires authentication and family membership
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - file: image file (JPEG, PNG, GIF, WebP, max 5MB)
 *
 * Response (200): { imageUrl: string }
 * Response (400): Missing file, invalid file type, or file size exceeded
 * Response (401): Authentication required
 * Response (403): Not a family member
 */
export function uploadRecipeImageRoute(): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/upload-image",
    authenticate,
    upload.single("file"),
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.user?.id) {
          throw HttpError.unauthorized("Authentication required");
        }

        if (!req.params.familyId) {
          throw HttpError.badRequest("Missing familyId parameter");
        }

        // Validate file exists
        if (!req.file) {
          throw HttpError.badRequest("File is required");
        }

        // Additional file size validation (in case multer limits don't catch it)
        if (!validateFileSize(req.file.size)) {
          throw HttpError.badRequest("File size must be less than 5MB");
        }

        const userId = validateObjectId(req.user.id, "userId");
        const familyId = validateObjectId(req.params.familyId, "familyId");

        // Authorize family membership (any member can upload recipe images)
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership) {
          throw HttpError.forbidden(
            "Only family members can upload recipe images",
          );
        }

        // Upload to MinIO
        const imageUrl = await uploadRecipeImage(req.file, familyId.toString());

        res.status(200).json({ imageUrl });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
