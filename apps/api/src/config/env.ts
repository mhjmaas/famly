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
