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
  MINIO_ACCESS_KEY: z.string().min(1).describe("MinIO access key"),
  MINIO_SECRET_KEY: z
    .string()
    .min(8)
    .describe("MinIO secret key (min 8 chars)"),
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
    MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
    MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
    MINIO_BUCKET: process.env.MINIO_BUCKET,
    MINIO_USE_SSL: process.env.MINIO_USE_SSL,
    DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE,
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
