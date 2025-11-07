import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { type NextRequest, NextResponse } from "next/server";

/**
 * S3Client configured for MinIO
 */
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: `http${process.env.MINIO_USE_SSL === "true" ? "s" : ""}://${process.env.MINIO_ENDPOINT}`,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

/**
 * Content-Type mapping based on file extension
 */
const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

/**
 * GET /api/images/[...path] - Proxy images from MinIO storage
 *
 * Fetches images from MinIO and streams them to the client with proper caching headers
 *
 * Path format: /api/images/{familyId}/{filename}
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await context.params;

    // Validate path
    if (!path || path.length < 2) {
      return NextResponse.json(
        { error: "Invalid image path" },
        { status: 400 },
      );
    }

    // Extract familyId and filename
    const [familyId, filename] = path;
    const s3Key = `${familyId}/${filename}`;

    // Get file extension for Content-Type
    const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
    const contentType = CONTENT_TYPES[extension] || "image/jpeg";

    // Fetch image from MinIO
    const command = new GetObjectCommand({
      Bucket: process.env.MINIO_BUCKET || "famly-rewards",
      Key: s3Key,
    });

    const response = await s3Client.send(command);

    // Stream the image data
    if (!response.Body) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Convert the stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    // Return the image with caching headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: any) {
    console.error("Error fetching image from MinIO:", error);

    // Handle NotFound errors
    if (error.name === "NoSuchKey" || error.name === "NotFound") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 },
    );
  }
}
