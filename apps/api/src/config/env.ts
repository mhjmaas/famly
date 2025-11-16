import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z
    .string()
    .regex(/^mongodb(\+srv)?:\/\/.+/, {
      message:
        "Invalid MongoDB URI. Expected format starting with mongodb:// or mongodb+srv://",
    })
    .describe("MongoDB connection string (standalone or replica set)"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32)
    .describe("Better Auth JWT secret (min 32 chars)"),
  BETTER_AUTH_URL: z.string().url().describe("Better Auth API URL"),
  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:3000")
    .describe("Frontend client URL for CORS"),
  MINIO_ENDPOINT: z.string().min(1).describe("MinIO endpoint (host:port)"),
  MINIO_ROOT_USER: z.string().min(1).describe("MinIO root user"),
  MINIO_ROOT_PASSWORD: z
    .string()
    .min(8)
    .describe("MinIO root password (min 8 chars)"),
  MINIO_BUCKET: z
    .string()
    .min(1)
    .describe("MinIO bucket name for reward images"),
  MINIO_USE_SSL: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true")
    .describe("Whether to use SSL for MinIO connection"),
  DEPLOYMENT_MODE: z
    .enum(["saas", "standalone"])
    .default("saas")
    .describe(
      "Deployment mode: saas (multi-tenant) or standalone (single-family)",
    ),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z
    .string()
    .optional()
    .describe("VAPID public key for push notifications"),
  VAPID_PRIVATE_KEY: z
    .string()
    .optional()
    .describe("VAPID private key for push notifications"),
});

type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) {
    return parsedEnv;
  }

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    CLIENT_URL: process.env.CLIENT_URL,
    MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
    MINIO_ROOT_USER: process.env.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: process.env.MINIO_ROOT_PASSWORD,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
  };

  try {
    parsedEnv = envSchema.parse(env);
    return parsedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = (error.issues || [])
        .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`Environment validation failed:\n${messages}`);
    }
    throw error;
  }
}

export type { Env };
