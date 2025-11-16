/**
 * Hook to check if the application is running in E2E test mode
 * Used to disable overlays and interactive elements that interfere with tests
 */
export function useIsE2ETest(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return process.env.NEXT_PUBLIC_E2E_TEST === "true";
}
