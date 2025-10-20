import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { ChildProcess, spawn } from 'child_process';
import { MongoClient } from 'mongodb';
import { logger } from '../../../src/lib/logger';

let mongoContainer: StartedMongoDBContainer;
let serverProcess: ChildProcess;
let mongoClient: MongoClient;

/**
 * E2E Test Setup using Testcontainers
 *
 * This setup:
 * 1. Starts a real MongoDB container
 * 2. Starts the actual server as a child process
 * 3. Runs better-auth without any mocking
 * 4. Tests the complete authentication flow end-to-end via HTTP
 */

export async function setupE2E(): Promise<string> {
  // Start MongoDB container
  logger.info('Starting MongoDB container...');
  mongoContainer = await new MongoDBContainer('mongo:7.0').start();

  // Build connection string with localhost
  const host = mongoContainer.getHost();
  const mongoPort = mongoContainer.getMappedPort(27017);
  const mongoUri = `mongodb://${host}:${mongoPort}`;
  logger.info('MongoDB container started at:', mongoUri);

  // Create MongoDB client for test utilities
  mongoClient = new MongoClient(mongoUri, { directConnection: true });
  await mongoClient.connect();

  // Start the server as a child process
  logger.info('Starting API server...');
  const port = 3001;

  serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
    env: {
      ...process.env,
      MONGODB_URI: mongoUri,
      NODE_ENV: 'test',
      PORT: port.toString(),
      BETTER_AUTH_SECRET: 'test_better_auth_secret_min_32_chars_x',
      BETTER_AUTH_URL: `http://localhost:${port}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // Collect all output for debugging
  const allOutput: string[] = [];

  serverProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    allOutput.push(`[stdout] ${output}`);
  });

  serverProcess.stderr?.on('data', (data) => {
    const output = data.toString();
    allOutput.push(`[stderr] ${output}`);
  });

  // Wait for server to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      logger.debug('Server output:');
      logger.debug(allOutput.join(''));
      reject(new Error('Server failed to start within 30 seconds'));
    }, 30000);

    let resolved = false;

    const checkAndResolve = () => {
      const fullOutput = allOutput.join('');
      if (!resolved && fullOutput.includes('listening on port')) {
        resolved = true;
        clearTimeout(timeout);
        // Wait a bit more for the server to be fully ready
        setTimeout(() => resolve(), 1000);
      }
    };

    // Check output every 100ms
    const interval = setInterval(checkAndResolve, 100);

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      clearInterval(interval);
      logger.debug('Server output:');
      logger.debug(allOutput.join(''));
      reject(error);
    });

    serverProcess.on('exit', (code) => {
      if (!resolved) {
        clearTimeout(timeout);
        clearInterval(interval);
        logger.debug('Server output:');
        logger.debug(allOutput.join(''));
        reject(new Error(`Server exited with code ${code}`));
      }
    });
  });

  logger.info('E2E test environment ready');
  const baseUrl = `http://localhost:${port}`;
  return baseUrl;
}

export async function teardownE2E(): Promise<void> {
  logger.info('Tearing down E2E test environment...');

  // Kill server process
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    await new Promise<void>((resolve) => {
      serverProcess.on('exit', () => {
        logger.info('Server process stopped');
        resolve();
      });
      // Force kill after 5 seconds
      setTimeout(() => {
        serverProcess.kill('SIGKILL');
        resolve();
      }, 5000);
    });
  }

  // Close MongoDB client
  if (mongoClient) {
    await mongoClient.close();
  }

  // Stop MongoDB container
  if (mongoContainer) {
    await mongoContainer.stop();
    logger.info('MongoDB container stopped');
  }
}

/**
 * Clean database between tests
 */
export async function cleanDatabase(): Promise<void> {
  if (!mongoClient) {
    throw new Error('MongoDB client not initialized. Call setupE2E() first.');
  }

  const db = mongoClient.db();

  // Drop all collections
  const collections = await db.listCollections().toArray();
  for (const collection of collections) {
    await db.collection(collection.name).deleteMany({});
  }
}
