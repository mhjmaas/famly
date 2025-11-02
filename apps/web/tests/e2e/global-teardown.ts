import { stopDockerServices } from './setup/docker-setup';

/**
 * Global teardown for E2E tests
 * Stops the Docker Compose test environment after all tests complete
 */
export default async function globalTeardown() {
  console.log('🐳 Stopping Docker Compose test environment...');
  
  try {
    await stopDockerServices();
    console.log('✅ Docker Compose test environment stopped');
  } catch (error) {
    console.error('❌ Failed to stop Docker Compose test environment:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  }
}
