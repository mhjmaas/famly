import { logger } from "@lib/logger";
import {
  type DeploymentConfig,
  DeploymentMode,
  type DeploymentStatusResponse,
} from "../domain/deployment-config";
import type { DeploymentConfigRepository } from "../repositories/deployment-config.repository";

export class DeploymentConfigService {
  constructor(private repository: DeploymentConfigRepository) {}

  /**
   * Get the deployment status
   *
   * @returns The deployment status (mode and onboarding completion)
   */
  async getStatus(): Promise<DeploymentStatusResponse> {
    const config = await this.repository.get();

    if (!config) {
      logger.warn(
        "Deployment config not found, returning default SaaS mode with onboarding incomplete",
      );
      return {
        mode: DeploymentMode.SaaS,
        onboardingCompleted: false,
      };
    }

    return {
      mode: config.mode,
      onboardingCompleted: config.onboardingCompleted,
    };
  }

  /**
   * Get the full deployment configuration
   *
   * @returns The deployment config document or null if not found
   */
  async getConfig(): Promise<DeploymentConfig | null> {
    return this.repository.get();
  }

  /**
   * Mark onboarding as completed
   * Only marks if not already completed
   *
   * @returns The updated deployment config or null if not found
   */
  async markOnboardingCompleted(): Promise<DeploymentConfig | null> {
    const config = await this.repository.get();

    if (!config) {
      logger.error(
        "Cannot mark onboarding complete: deployment config not found",
      );
      return null;
    }

    if (config.onboardingCompleted) {
      logger.debug("Onboarding already completed, skipping update");
      return config;
    }

    logger.info("Marking onboarding as completed");
    return this.repository.markOnboardingCompleted();
  }

  /**
   * Check if registration should be blocked
   * Registration is blocked in standalone mode after onboarding is complete
   *
   * @returns True if registration should be blocked, false otherwise
   */
  async shouldBlockRegistration(): Promise<boolean> {
    const config = await this.repository.get();

    if (!config) {
      return false;
    }

    return (
      config.mode === DeploymentMode.Standalone && config.onboardingCompleted
    );
  }

  /**
   * Check if onboarding should be marked complete after family creation
   * Only applicable in standalone mode when onboarding is not yet complete
   *
   * @returns True if onboarding should be marked complete, false otherwise
   */
  async shouldCompleteOnboarding(): Promise<boolean> {
    const config = await this.repository.get();

    if (!config) {
      return false;
    }

    return (
      config.mode === DeploymentMode.Standalone && !config.onboardingCompleted
    );
  }
}
