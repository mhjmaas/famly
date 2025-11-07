import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@infra/minio/client";
import { v4 as uuidv4 } from "uuid";
import { getEnv } from "@/config/env";

const env = getEnv();

/**
 * Allowed image MIME types for reward images
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Maximum file size in bytes (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validates if the file type is allowed
 */
export function validateFileType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

/**
 * Validates if the file size is within the allowed limit
 */
export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

/**
 * Extracts file extension from mimetype
 */
function getExtensionFromMimetype(mimetype: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return mimeToExt[mimetype] || "jpg";
}

/**
 * Uploads a reward image to MinIO storage
 *
 * @param file - The uploaded file from multer
 * @param familyId - The family ID for scoping the image
 * @returns The relative URL to access the image through the web app proxy
 */
export async function uploadRewardImage(
  file: Express.Multer.File,
  familyId: string,
): Promise<string> {
  // Generate unique filename with UUID
  const uuid = uuidv4();
  const extension = getExtensionFromMimetype(file.mimetype);
  const filename = `${uuid}.${extension}`;

  // Construct S3 key with family-scoped path
  const s3Key = `${familyId}/${filename}`;

  // Upload to MinIO
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.MINIO_BUCKET,
      Key: s3Key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  // Return relative URL that will be proxied through Next.js
  return `/api/images/${familyId}/${filename}`;
}
