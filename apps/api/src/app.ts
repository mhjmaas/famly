import { errorHandler } from "@middleware/error-handler";
import { toNodeHandler } from "better-auth/node";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import { getEnv } from "./config/env";
import { activityEventsRouter } from "./modules/activity-events/routes/activity-events.router";
import { getAuth } from "./modules/auth/better-auth";
import { createAuthRouter } from "./modules/auth/routes/auth.router";
import { createChatRouter } from "./modules/chat";
import { createMessageRoute } from "./modules/chat/routes/create-message.route";
import { searchMessagesRoute } from "./modules/chat/routes/search-messages.route";
import { createDiaryRouter } from "./modules/diary";
import { createFamiliesRouter } from "./modules/family/routes";
import { initializeRecipesModule } from "./modules/recipes/init";
import { initializeRewardsIntegration } from "./modules/rewards/init";
import { getTaskService } from "./modules/tasks/services/task.service.instance";
import { createHealthRouter } from "./routes/health";
import { createStatusRouter } from "./routes/status";

export const createApp = (): Express => {
  const app = express();
  const env = getEnv();

  // Initialize module integrations
  // This must happen before routes are mounted
  const taskService = getTaskService();
  initializeRewardsIntegration(taskService);

  // Initialize recipes module (ensure indexes)
  initializeRecipesModule().catch((error) => {
    console.error("Failed to initialize recipes module:", error);
  });

  app.disable("x-powered-by");

  // Trust first proxy (Caddy) for X-Forwarded-* headers
  // This allows secure cookies to work correctly when behind a reverse proxy
  // Caddy sets X-Forwarded-Proto: https, which Express uses to determine req.protocol
  app.set("trust proxy", 1);

  // Configure CORS - Allow both HTTP and HTTPS origins for flexibility
  const allowedOrigins = [
    env.CLIENT_URL, // Configured URL (from env: https://localhost:8443 or http://192.168.x.x:3000)
    "http://localhost:3000", // HTTP fallback for localhost
    "https://localhost:3000", // HTTPS for localhost (direct access)
    "https://localhost:8443", // HTTPS via Caddy reverse proxy (dev)
    "https://localhost", // HTTPS via Caddy reverse proxy (prod)
    "http://127.0.0.1:3000", // HTTP fallback for 127.0.0.1
    "https://127.0.0.1:3000", // HTTPS for 127.0.0.1
    "https://127.0.0.1:8443", // HTTPS via Caddy for 127.0.0.1 (dev)
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, or same-origin)
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true, // Allow cookies and authorization headers
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Parse JSON payloads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Parse cookies (Better Auth handles its own cookie signing)
  app.use(cookieParser());

  // Health check endpoint (before auth setup since health check doesn't need DB)
  app.use("/v1", createHealthRouter());

  // Status endpoint (unauthenticated, returns deployment mode and onboarding status)
  app.use("/v1", createStatusRouter());

  // Auth routes (Better Auth manages its own indexes)
  app.use("/v1/auth", createAuthRouter());

  // Diary routes (requires authentication)
  app.use("/v1/diary", createDiaryRouter());

  // Family routes (requires authentication)
  // Note: Tasks routes are mounted within the families router at /:familyId/tasks
  app.use("/v1/families", createFamiliesRouter());

  // Chat routes (requires authentication)
  app.use("/v1/chats", createChatRouter());

  // Message routes (requires authentication) - mounted at /v1/messages and /v1/search
  app.use("/v1", createMessageRoute());
  app.use("/v1/search", searchMessagesRoute());

  // Activity events routes (requires authentication)
  app.use("/v1/activity-events", activityEventsRouter());

  // Error handling middleware (last)
  app.use(errorHandler);

  return app;
};
