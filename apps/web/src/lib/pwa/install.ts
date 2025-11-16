/**
 * PWA Install Utility
 * Handles PWA installation prompts and detection
 */

export type Platform = "ios" | "android" | "desktop" | "unknown";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Extend the Window interface to include the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

/**
 * Detect the user's platform
 */
export function getPlatform(): Platform {
  // Check if running in browser
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "desktop"; // Default for SSR
  }

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  return "desktop";
}

/**
 * Check if the app is already installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
  // Check if running in browser
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false; // Default for SSR
  }

  // Check if running in standalone mode
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Check for iOS standalone mode
  const nav = navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) {
    return true;
  }

  return false;
}

/**
 * Check if the app can be installed
 */
export function canInstall(): boolean {
  return deferredPrompt !== null && !isAppInstalled();
}

/**
 * Capture the beforeinstallprompt event
 * This should be called early in the app lifecycle
 */
export function captureInstallPrompt(): void {
  // Check if running in browser
  if (typeof window === "undefined") {
    return; // Skip for SSR
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the default browser install prompt
    e.preventDefault();

    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;

    // Dispatch a custom event to notify the app
    window.dispatchEvent(new Event("appinstallable"));
  });

  // Listen for successful installation
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    console.log("PWA installed successfully");
  });
}

/**
 * Trigger the install prompt
 * @returns Promise resolving to the user's choice
 */
export async function triggerInstallPrompt(): Promise<{
  outcome: "accepted" | "dismissed";
  platform: string;
} | null> {
  if (!deferredPrompt) {
    console.warn("Install prompt not available");
    return null;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const choiceResult = await deferredPrompt.userChoice;

    // Clear the deferred prompt
    deferredPrompt = null;

    return choiceResult;
  } catch (error) {
    console.error("Error triggering install prompt:", error);
    return null;
  }
}

/**
 * Check if the device is mobile (iOS or Android)
 */
export function isMobileDevice(): boolean {
  const platform = getPlatform();
  return platform === "ios" || platform === "android";
}

/**
 * Check if iOS install instructions should be shown
 */
export function shouldShowIOSInstructions(): boolean {
  return getPlatform() === "ios" && !isAppInstalled();
}

/**
 * Get install instructions for the current platform
 */
export function getInstallInstructions(): string {
  const platform = getPlatform();

  switch (platform) {
    case "ios":
      return "Tap the share button and select 'Add to Home Screen'";
    case "android":
      return "Tap the menu and select 'Install app' or 'Add to Home screen'";
    case "desktop":
      return "Click the install button in your browser's address bar";
    default:
      return "Install this app for a better experience";
  }
}
