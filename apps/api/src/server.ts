import "dotenv/config";
import { ensureBucketExists } from "@infra/minio/client";
import { connectMongo, disconnectMongo } from "@infra/mongo/client";
import { logger } from "@lib/logger";
import { setSocketIOServer } from "@modules/chat/realtime/events/chat-events";
import { registerConnectionHandler } from "@modules/chat/realtime/register-handlers";
import { ChatRepository } from "@modules/chat/repositories/chat.repository";
import { MembershipRepository } from "@modules/chat/repositories/membership.repository";
import { MessageRepository } from "@modules/chat/repositories/message.repository";
import { seedDeploymentConfig } from "@modules/deployment-config";
import { DiaryRepository } from "@modules/diary";
import { FamilyRepository } from "@modules/family/repositories/family.repository";
import { FamilyMembershipRepository } from "@modules/family/repositories/family-membership.repository";
import { FamilySettingsRepository } from "@modules/family/repositories/family-settings.repository";
import { KarmaRepository } from "@modules/karma";
import { authenticateSocket, createSocketServer } from "@modules/realtime";
import { ShoppingListRepository } from "@modules/shopping-lists";
import {
  ScheduleRepository,
  startTaskScheduler,
  TaskRepository,
} from "@modules/tasks";
import { createApp } from "./app";

const DEFAULT_PORT = 4000;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

async function start() {
  logger.info("Starting Famly API server...");
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(
    `MongoDB URI: ${process.env.MONGODB_URI?.replace(
      /\/\/.*@/,
      "//**redacted**@",
    )}`,
  );

  // Connect to MongoDB
  logger.info("Connecting to MongoDB...");
  await connectMongo();
  logger.info("MongoDB connected successfully");

  // Seed deployment configuration
  logger.info("Seeding deployment configuration...");
  await seedDeploymentConfig();
  logger.info("Deployment configuration seeded successfully");

  // Initialize MinIO bucket
  logger.info("Initializing MinIO bucket...");
  await ensureBucketExists();
  logger.info("MinIO bucket initialized successfully");

  // Initialize chat module indexes
  logger.info("Initializing chat module indexes...");
  const chatRepo = new ChatRepository();
  const messageRepo = new MessageRepository();
  const chatMembershipRepo = new MembershipRepository();
  await Promise.all([
    chatRepo.ensureIndexes(),
    messageRepo.ensureIndexes(),
    chatMembershipRepo.ensureIndexes(),
  ]);
  logger.info("Chat module indexes initialized successfully");

  // Initialize family module indexes
  logger.info("Initializing family module indexes...");
  const familyRepo = new FamilyRepository();
  const familyMembershipRepo = new FamilyMembershipRepository();
  const familySettingsRepo = new FamilySettingsRepository();
  await Promise.all([
    familyRepo.ensureIndexes(),
    familyMembershipRepo.ensureIndexes(),
    familySettingsRepo.ensureIndexes(),
  ]);
  logger.info("Family module indexes initialized successfully");

  // Initialize task module indexes
  logger.info("Initializing task module indexes...");
  const taskRepo = new TaskRepository();
  const scheduleRepo = new ScheduleRepository();
  await Promise.all([taskRepo.ensureIndexes(), scheduleRepo.ensureIndexes()]);
  logger.info("Task module indexes initialized successfully");

  // Initialize shopping lists module indexes
  logger.info("Initializing shopping lists module indexes...");
  const shoppingListRepo = new ShoppingListRepository();
  await shoppingListRepo.ensureIndexes();
  logger.info("Shopping lists module indexes initialized successfully");

  // Initialize diary module indexes
  logger.info("Initializing diary module indexes...");
  const diaryRepo = new DiaryRepository();
  await diaryRepo.ensureIndexes();
  logger.info("Diary module indexes initialized successfully");

  // Initialize karma module indexes
  logger.info("Initializing karma module indexes...");
  const karmaRepo = new KarmaRepository();
  await karmaRepo.ensureIndexes();
  logger.info("Karma module indexes initialized successfully");

  // Start task scheduler cron job
  logger.info("Starting task scheduler...");
  startTaskScheduler();
  logger.info("Task scheduler started successfully");

  // Create and start the Express app
  logger.info("Creating Express app...");
  const app = createApp();

  const server = app.listen(port, () => {
    logger.info(`Famly API listening on port ${port}`);
  });

  // Initialize Socket.IO
  logger.info("Initializing Socket.IO server...");
  const io = createSocketServer(
    server,
    authenticateSocket,
    registerConnectionHandler,
  );

  // Register Socket.IO instance with chat module for backward compatibility
  setSocketIOServer(io);

  logger.info("Socket.IO server initialized successfully");

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info("HTTP server closed");

      // Close MongoDB connection
      try {
        await disconnectMongo();
        logger.info("MongoDB disconnected");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown:", error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

// Start the server
start().catch((error) => {
  logger.error("Failed to start server:", error);
  logger.error(
    "Error details:",
    error instanceof Error ? error.message : String(error),
  );
  if (error instanceof Error && error.stack) {
    logger.error("Stack trace:", error.stack);
  }
  console.log(error);
  process.exit(1);
});
