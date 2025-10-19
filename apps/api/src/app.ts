import express, { Express } from 'express';
import { createHealthRouter } from './routes/health';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use('/v1', createHealthRouter());

  return app;
};
