import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import { createHealthRouter } from './routes/health';
import { createAuthRouter } from './modules/auth/routes/auth.router';
import { errorHandler } from '@middleware/error-handler';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');

  // Parse JSON payloads
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Parse cookies (Better Auth handles its own cookie signing)
  app.use(cookieParser());

  // Health check endpoint (before auth setup since health check doesn't need DB)
  app.use('/v1', createHealthRouter());

  // Auth routes (Better Auth manages its own indexes)
  app.use('/v1/auth', createAuthRouter());

  // Error handling middleware (last)
  app.use(errorHandler);

  return app;
};
