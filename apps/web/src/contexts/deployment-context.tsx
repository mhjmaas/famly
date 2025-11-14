/**
 * Deployment Mode Context
 *
 * Provides deployment mode information throughout the app.
 * Fetched once at the root layout level and made available to all components.
 *
 * Usage:
 * - Server Components: Import getDeploymentStatus directly
 * - Client Components: Use useDeploymentMode() hook
 */

"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { DeploymentStatus } from "../lib/utils/status-utils";

const DeploymentContext = createContext<DeploymentStatus | undefined>(
  undefined,
);

interface DeploymentProviderProps {
  children: ReactNode;
  status: DeploymentStatus;
}

/**
 * Provider component that makes deployment status available to all child components
 * Should be used at the root layout level
 */
export function DeploymentProvider({
  children,
  status,
}: DeploymentProviderProps) {
  return (
    <DeploymentContext.Provider value={status}>
      {children}
    </DeploymentContext.Provider>
  );
}

/**
 * Hook to access deployment mode in client components
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { mode, onboardingCompleted } = useDeploymentMode();
 *
 *   if (mode === "standalone") {
 *     return <StandaloneUI />;
 *   }
 *   return <SaaSUI />;
 * }
 * ```
 */
export function useDeploymentMode(): DeploymentStatus {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error(
      "useDeploymentMode must be used within a DeploymentProvider",
    );
  }
  return context;
}

/**
 * Helper hook to check if app is in standalone mode
 */
export function useIsStandalone(): boolean {
  const { mode } = useDeploymentMode();
  return mode === "standalone";
}

/**
 * Helper hook to check if onboarding is completed
 */
export function useIsOnboardingCompleted(): boolean {
  const { onboardingCompleted } = useDeploymentMode();
  return onboardingCompleted;
}
