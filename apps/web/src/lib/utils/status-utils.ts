/**
 * Status utilities for deployment mode and onboarding status
 * Provides cached access to deployment status with fallback behavior
 */

import { fetchDeploymentStatus } from "@/lib/api-client";

export type DeploymentMode = "saas" | "standalone";

export interface DeploymentStatus {
  mode: DeploymentMode;
  onboardingCompleted: boolean;
}

/**
 * Deployment status is fetched without caching until onboarding completes.
 * Once onboarding is done we store the status in-memory to avoid extra API calls.
 * We also keep a short-lived in-flight promise to dedupe concurrent requests.
 */
const NEXT_CACHE_REVALIDATE_SECONDS = 60 * 60 * 24; // 24 hours

let completedStatusCache: DeploymentStatus | null = null;
let inflightStatusPromise: Promise<DeploymentStatus> | null = null;

async function fetchFreshStatus(
  useNextCache: boolean,
): Promise<DeploymentStatus> {
  try {
    const status = await fetchDeploymentStatus({
      cacheMode: useNextCache ? "force-cache" : "no-store",
      nextRevalidateSeconds: useNextCache
        ? NEXT_CACHE_REVALIDATE_SECONDS
        : undefined,
    });
    if (status.onboardingCompleted) {
      completedStatusCache = status;
    } else {
      completedStatusCache = null;
    }

    // Warm the Next.js cache once onboarding completes so future processes can reuse it
    if (!useNextCache && status.onboardingCompleted) {
      fetchDeploymentStatus({
        cacheMode: "force-cache",
        nextRevalidateSeconds: NEXT_CACHE_REVALIDATE_SECONDS,
      }).catch((error) =>
        console.warn("Failed to warm deployment status cache:", error),
      );
    }
    return status;
  } catch (error) {
    console.warn("API unavailable, falling back to SaaS mode:", error);
    completedStatusCache = null;
    return { mode: "saas", onboardingCompleted: false };
  }
}

export async function getDeploymentStatus(
  options: { forceRefresh?: boolean } = {},
): Promise<DeploymentStatus> {
  const { forceRefresh = false } = options;

  if (!forceRefresh && completedStatusCache) {
    return completedStatusCache;
  }

  if (!forceRefresh && inflightStatusPromise) {
    return inflightStatusPromise;
  }

  const useNextCache =
    !forceRefresh && completedStatusCache?.onboardingCompleted === true;

  const requestPromise = fetchFreshStatus(useNextCache);

  if (!forceRefresh) {
    inflightStatusPromise = requestPromise;
    requestPromise.finally(() => {
      if (inflightStatusPromise === requestPromise) {
        inflightStatusPromise = null;
      }
    });
  }

  return requestPromise;
}

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
