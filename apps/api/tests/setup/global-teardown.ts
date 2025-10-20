import { logger } from '../../src/lib/logger';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __MONGO_INSTANCE__: any;
}

export default async function globalTeardown() {
  if (global.__MONGO_INSTANCE__) {
    await global.__MONGO_INSTANCE__.stop();
    logger.info('MongoDB Memory Server stopped');
  }
}
