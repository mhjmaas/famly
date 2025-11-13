import { Readable } from "node:stream";
import {
  GetObjectCommand,
  type GetObjectCommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";
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
  _request: NextRequest,
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

    const buffer = await bodyToBuffer(response.Body);

    // Return the image with caching headers
    return new NextResponse(Uint8Array.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching image from MinIO:", error);

    const errorName =
      typeof error === "object" && error && "name" in error
        ? String((error as { name?: string }).name)
        : undefined;

    // Handle NotFound errors
    if (errorName === "NoSuchKey" || errorName === "NotFound") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Handle other errors
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 },
    );
  }
}

type ObjectBody = NonNullable<GetObjectCommandOutput["Body"]>;

async function bodyToBuffer(
  body: GetObjectCommandOutput["Body"],
): Promise<Buffer> {
  if (!body) {
    throw new Error("Response body is empty");
  }

  if (body instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of body) {
      if (typeof chunk === "string") {
        chunks.push(Buffer.from(chunk));
      } else {
        chunks.push(Buffer.from(chunk));
      }
    }
    return Buffer.concat(chunks);
  }

  if (isReadableStream(body)) {
    const reader = body.getReader();
    const chunks: Buffer[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(Buffer.from(value));
      }
    }
    reader.releaseLock();
    return Buffer.concat(chunks);
  }

  if (body instanceof Blob) {
    const arrayBuffer = await body.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  throw new Error("Unsupported response body type");
}

function isReadableStream(body: ObjectBody): body is ObjectBody & {
  getReader: () => ReadableStreamDefaultReader<Uint8Array>;
} {
  return "getReader" in body && typeof body.getReader === "function";
}
