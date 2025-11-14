import { HttpError } from "@lib/http-error";
import { validateObjectId } from "@lib/objectid-utils";
import type { AuthenticatedRequest } from "@modules/auth/middleware/authenticate";
import { authenticate } from "@modules/auth/middleware/authenticate";
import { FamilyRole } from "@modules/family/domain/family";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import type { NextFunction, Response } from "express";
import { Router } from "express";
import multer from "multer";
import {
  uploadRewardImage,
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
        ) as any,
      );
      return;
    }
    cb(null, true);
  },
});

/**
 * POST /rewards/upload-image - Upload an image for a reward
 *
 * Requires authentication, family membership, and parent role
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - file: image file (JPEG, PNG, GIF, WebP, max 5MB)
 *
 * Response (200): { imageUrl: string }
 * Response (400): Missing file, invalid file type, or file size exceeded
 * Response (401): Authentication required
 * Response (403): Not a parent or not a family member
 */
export function uploadImageRoute(): Router {
  const router = Router({ mergeParams: true });

  router.post(
    "/rewards/upload-image",
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

        // Authorize parent role
        const membershipRepository = new FamilyMembershipRepository();
        const membership = await membershipRepository.findByFamilyAndUser(
          familyId,
          userId,
        );

        if (!membership || membership.role !== FamilyRole.Parent) {
          throw HttpError.forbidden("Only parents can upload reward images");
        }

        // Upload to MinIO
        const imageUrl = await uploadRewardImage(req.file, familyId);

        res.status(200).json({ imageUrl });
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
}
