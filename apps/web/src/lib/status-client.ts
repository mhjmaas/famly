/**
 * Status API client for deployment mode and onboarding status
 * This endpoint is unauthenticated and can be called from anywhere
 */

import { cache } from "react";

export type DeploymentMode = "saas" | "standalone";

export interface DeploymentStatus {
  mode: DeploymentMode;
  onboardingCompleted: boolean;
}

// Use different API URLs for server-side vs client-side
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3001"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
      const response = await fetch(`${API_BASE_URL}/v1/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Use force-cache for SSR optimization - status rarely changes
        // Next.js will revalidate on each request in development
        cache: "force-cache",
        next: {
          // Revalidate every 24 hours in production
          // This balances freshness with performance
          revalidate: 86400,
        },
      });

      if (!response.ok) {
        console.warn(
          `Failed to fetch deployment status: ${response.statusText}, falling back to SaaS mode`,
        );
        return { mode: "saas", onboardingCompleted: false };
      }

      return response.json();
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
