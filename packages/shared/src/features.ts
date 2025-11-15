/**
 * Centralized feature configuration
 * Single source of truth for all application features
 * Used by both API and Web applications
 */

/**
 * Feature key enum - defines all available features
 */
export enum FeatureKey {
  Tasks = "tasks",
  Rewards = "rewards",
  ShoppingLists = "shoppingLists",
  Recipes = "recipes",
  Locations = "locations",
  Memories = "memories",
  Diary = "diary",
  Chat = "chat",
  AIIntegration = "aiIntegration",
}

/**
 * All available features as an array
 */
export const ALL_FEATURES = [
  FeatureKey.Tasks,
  FeatureKey.Rewards,
  FeatureKey.ShoppingLists,
  FeatureKey.Recipes,
  FeatureKey.Locations,
  FeatureKey.Memories,
  FeatureKey.Diary,
  FeatureKey.Chat,
  FeatureKey.AIIntegration,
] as const;

/**
 * Feature type - derived from ALL_FEATURES array
 */
export type Feature = (typeof ALL_FEATURES)[number];

/**
 * Feature metadata including routes and navigation mappings
 */
interface FeatureMetadata {
  key: FeatureKey;
  /** URL path for the feature (e.g., "/app/tasks") */
  route: string;
  /** Navigation item name to display in sidebar */
  navName: string;
  /** Whether this feature appears in navigation and settings */
  isNavigable: boolean;
}

/**
 * Complete feature registry with metadata
 * Consolidates route, navigation, and feature definitions
 */
export const FEATURES_REGISTRY: Record<FeatureKey, FeatureMetadata> = {
  [FeatureKey.Tasks]: {
    key: FeatureKey.Tasks,
    route: "/app/tasks",
    navName: "tasks",
    isNavigable: true,
  },
  [FeatureKey.Rewards]: {
    key: FeatureKey.Rewards,
    route: "/app/rewards",
    navName: "rewards",
    isNavigable: true,
  },
  [FeatureKey.ShoppingLists]: {
    key: FeatureKey.ShoppingLists,
    route: "/app/shopping-lists",
    navName: "shoppingLists",
    isNavigable: true,
  },
  [FeatureKey.Recipes]: {
    key: FeatureKey.Recipes,
    route: "/app/recipes",
    navName: "recipes",
    isNavigable: true,
  },
  [FeatureKey.Locations]: {
    key: FeatureKey.Locations,
    route: "/app/locations",
    navName: "locations",
    isNavigable: true,
  },
  [FeatureKey.Memories]: {
    key: FeatureKey.Memories,
    route: "/app/memories",
    navName: "memories",
    isNavigable: true,
  },
  [FeatureKey.Diary]: {
    key: FeatureKey.Diary,
    route: "/app/diary",
    navName: "diary",
    isNavigable: true,
  },
  [FeatureKey.Chat]: {
    key: FeatureKey.Chat,
    route: "/app/chat",
    navName: "chat",
    isNavigable: true,
  },
  [FeatureKey.AIIntegration]: {
    key: FeatureKey.AIIntegration,
    route: "/app/ai-settings",
    navName: "aiSettings",
    isNavigable: true,
  },
};

/**
 * Get feature metadata by key
 */
export function getFeatureMetadata(featureKey: FeatureKey): FeatureMetadata {
  return FEATURES_REGISTRY[featureKey];
}

/**
 * Get feature key by route path
 * Useful for middleware to determine which feature is being accessed
 */
export function getFeatureKeyByRoute(routePath: string): FeatureKey | null {
  for (const feature of ALL_FEATURES) {
    const metadata = FEATURES_REGISTRY[feature];
    if (routePath.startsWith(metadata.route)) {
      return feature;
    }
  }
  return null;
}

/**
 * Get feature navigation name by key
 * Maps from feature key to navigation item name (e.g., "aiIntegration" -> "aiSettings")
 */
export function getFeatureNavName(featureKey: FeatureKey): string {
  return FEATURES_REGISTRY[featureKey].navName;
}

/**
 * Get all feature routes as a record
 * Useful for middleware feature access control
 */
export function getFeatureRoutes(): Record<string, string> {
  const routes: Record<string, string> = {};
  for (const feature of ALL_FEATURES) {
    const metadata = FEATURES_REGISTRY[feature];
    routes[metadata.key] = metadata.route;
  }
  return routes;
}

/**
 * Get all navigable features
 */
export function getNavigableFeatures(): FeatureKey[] {
  return ALL_FEATURES.filter(
    (feature) => FEATURES_REGISTRY[feature].isNavigable
  );
}
