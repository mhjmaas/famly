import { MongoMemoryServer } from 'mongodb-memory-server';
import { logger } from '../../src/lib/logger';

declare global {
  var __MONGO_URI__: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __MONGO_INSTANCE__: any;
}

let mongoServer: MongoMemoryServer;

export default async function globalSetup() {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.0',
    },
  });

  const mongoUri = mongoServer.getUri();
  process.env.MONGODB_URI = mongoUri;
  process.env.BETTER_AUTH_SECRET = 'test_better_auth_secret_min_32_chars_long_x';
  process.env.BETTER_AUTH_URL = 'http://localhost:3000';
  process.env.NODE_ENV = 'test';

  // Store the URI globally so globalTeardown can access it
  global.__MONGO_URI__ = mongoUri;
  global.__MONGO_INSTANCE__ = mongoServer;

  logger.info(`MongoDB Memory Server started at ${mongoUri}`);
}
