import 'dotenv/config';
import { createApp } from './app';
import { connectMongo } from '@infra/mongo/client';
import { logger } from '@lib/logger';

const DEFAULT_PORT = 4000;
const port = Number(process.env.PORT ?? DEFAULT_PORT);

async function start() {
  logger.info('Starting Famly API server...');
  logger.info(`Environment: ${process.env.NODE_ENV}`);
  logger.info(`MongoDB URI: ${process.env.MONGODB_URI?.replace(/\/\/.*@/, '//**redacted**@')}`);

  // Connect to MongoDB
  logger.info('Connecting to MongoDB...');
  await connectMongo();
  logger.info('MongoDB connected successfully');

  // Create and start the Express app
  logger.info('Creating Express app...');
  const app = createApp();

  const server = app.listen(port, () => {
    logger.info(`Famly API listening on port ${port}`);
  });

  // Graceful shutdown handler
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      // Close MongoDB connection
      try {
        const { disconnectMongo } = await import('@infra/mongo/client');
        await disconnectMongo();
        logger.info('MongoDB disconnected');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Start the server
start().catch((error) => {
  logger.error('Failed to start server:', error);
  logger.error('Error details:', error instanceof Error ? error.message : String(error));
  if (error instanceof Error && error.stack) {
    logger.error('Stack trace:', error.stack);
  }
  process.exit(1);
});
