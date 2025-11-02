import { startDockerServices } from './setup/docker-setup';

/**
 * Global setup for E2E tests
 * Starts the Docker Compose test environment before running tests
 */
export default async function globalSetup() {
  console.log('🐳 Starting Docker Compose test environment...');
  
  try {
    await startDockerServices();
    console.log('✅ Docker Compose test environment is ready');
  } catch (error) {
    console.error('❌ Failed to start Docker Compose test environment:', error);
    throw error;
  }
}
