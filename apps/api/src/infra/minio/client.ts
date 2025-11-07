import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getEnv } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

const env = getEnv();

/**
 * S3Client configured for MinIO
 * Uses S3-compatible API to interact with MinIO object storage
 */
export const s3Client = new S3Client({
  region: "eu-west-1", // MinIO requires a region but it's not used
  endpoint: `http${env.MINIO_USE_SSL ? "s" : ""}://${env.MINIO_ENDPOINT}`,
  credentials: {
    accessKeyId: env.MINIO_ACCESS_KEY,
    secretAccessKey: env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * Ensures the configured bucket exists, creating it if necessary
 */
export async function ensureBucketExists(): Promise<void> {
  const bucketName = env.MINIO_BUCKET;

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info(`MinIO bucket '${bucketName}' exists`);
  } catch (error) {
    // If bucket doesn't exist, create it
    if ((error as { name?: string }).name === "NotFound") {
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        logger.info(`MinIO bucket '${bucketName}' created successfully`);
      } catch (createError) {
        logger.error(
          `Failed to create MinIO bucket '${bucketName}':`,
          createError,
        );
        throw createError;
      }
    } else {
      logger.error(`Failed to check MinIO bucket '${bucketName}':`, error);
      throw error;
    }
  }
}
