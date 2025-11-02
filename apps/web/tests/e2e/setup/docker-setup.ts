import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

// Path from project root to docker compose file
const PROJECT_ROOT = path.resolve(__dirname, "../../../../..");
const DOCKER_COMPOSE_FILE = path.join(PROJECT_ROOT, "docker/compose.test.yml");
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 2000; // 2 seconds

/**
 * Start Docker Compose services for testing
 */
export async function startDockerServices(): Promise<void> {
  console.log("Starting Docker Compose test environment...");

  try {
    // Start services
    await execAsync(`docker compose -f ${DOCKER_COMPOSE_FILE} up -d`, {
      cwd: PROJECT_ROOT,
    });

    // Wait for services to be healthy
    await waitForServices();

    console.log("Docker Compose test environment is ready");
  } catch (error) {
    console.error("Failed to start Docker services:", error);
    throw error;
  }
}

/**
 * Stop Docker Compose services
 */
export async function stopDockerServices(): Promise<void> {
  console.log("Stopping Docker Compose test environment...");

  try {
    await execAsync(`docker compose -f ${DOCKER_COMPOSE_FILE} down -v`, {
      cwd: PROJECT_ROOT,
    });
    console.log("Docker Compose test environment stopped");
  } catch (error) {
    console.error("Failed to stop Docker services:", error);
    throw error;
  }
}

/**
 * Wait for all services to be healthy
 * Only waits for API since web runs on host
 * Uses Docker healthcheck status instead of polling
 */
async function waitForServices(): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    try {
      // Check Docker container health status
      const { stdout } = await execAsync(
        'docker inspect --format="{{.State.Health.Status}}" famly-api-test',
        { cwd: PROJECT_ROOT },
      );

      const healthStatus = stdout.trim();

      if (healthStatus === "healthy") {
        console.log("API service is healthy");
        return;
      }

      if (healthStatus === "unhealthy") {
        throw new Error("API service is unhealthy");
      }

      // Status is 'starting', continue waiting
    } catch (_error) {
      // Container might not exist yet or health check not configured
      // Fall back to direct HTTP check
      try {
        const response = await fetch("http://localhost:3002/v1/health");
        if (response.ok) {
          console.log("API service is ready");
          return;
        }
      } catch {
        // Service not ready yet, continue waiting
      }
    }

    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL));
  }

  throw new Error("API service failed to become healthy within timeout");
}

/**
 * Check if Docker is running
 */
export async function isDockerRunning(): Promise<boolean> {
  try {
    await execAsync("docker info");
    return true;
  } catch {
    return false;
  }
}
