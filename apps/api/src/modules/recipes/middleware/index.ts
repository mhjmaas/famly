// Re-export family auth middleware from auth module
// Recipes module uses the same family membership verification as other modules

export { requireFamilyRole } from "@modules/auth/lib/require-family-role";
export { authenticate } from "@modules/auth/middleware/authenticate";
