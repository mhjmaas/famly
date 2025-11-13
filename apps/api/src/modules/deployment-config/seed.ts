import { getEnv } from "@config/env";
import { logger } from "@lib/logger";
import type { DeploymentMode } from "./domain/deployment-config";
import { DeploymentConfigRepository } from "./repositories/deployment-config.repository";

/**
 * Seed the deployment configuration if it doesn't exist
 * This should be called during application startup
 */
export async function seedDeploymentConfig(): Promise<void> {
  const repository = new DeploymentConfigRepository();
  const env = getEnv();

  // Check if deployment config already exists
  const existing = await repository.get();

  if (existing) {
    logger.info(
      `Deployment config already exists: mode=${existing.mode}, onboardingCompleted=${existing.onboardingCompleted}`,
    );
    return;
  }

  // Create deployment config with mode from environment
  const mode = env.DEPLOYMENT_MODE as DeploymentMode;
  logger.info(`Creating deployment config with mode=${mode}`);

  await repository.create(mode);

  logger.info(
    `Deployment config created successfully: mode=${mode}, onboardingCompleted=false`,
  );
}
