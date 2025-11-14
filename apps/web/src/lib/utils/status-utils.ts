/**
 * Status utilities for deployment mode and onboarding status
 * Provides cached access to deployment status with fallback behavior
 */

import { cache } from "react";
import { fetchDeploymentStatus } from "@/lib/api-client";

export type DeploymentMode = "saas" | "standalone";

export interface DeploymentStatus {
  mode: DeploymentMode;
  onboardingCompleted: boolean;
}

/**
 * Fetch deployment status (mode and onboarding completion)
 * This is an unauthenticated endpoint
 *
 * Uses React cache() to deduplicate requests during SSR.
 * This means multiple components can call this function during a single render,
 * but only one actual API request will be made.
 *
 * Falls back to SaaS mode if API is unavailable (e.g., during E2E test startup).
 */
export const getDeploymentStatus = cache(
  async (): Promise<DeploymentStatus> => {
    try {
      return await fetchDeploymentStatus();
    } catch (error) {
      // Fallback to SaaS mode if API is unavailable
      // This handles cases like E2E test startup where API isn't ready yet
      console.warn("API unavailable, falling back to SaaS mode:", error);
      return { mode: "saas", onboardingCompleted: false };
    }
  },
);

/**
 * Check if the application is in standalone mode
 */
export async function isStandaloneMode(): Promise<boolean> {
  const status = await getDeploymentStatus();
  return status.mode === "standalone";
}

/**
 * Check if onboarding is completed (relevant for standalone mode)
 */
export async function isOnboardingCompleted(): Promise<boolean> {
  const status = await getDeploymentStatus();
  return status.onboardingCompleted;
}
