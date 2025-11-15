# Proposal: Enable Family Feature Toggles

## Problem Statement
Currently, all features in Famly are enabled for every family, regardless of whether they use them. This creates unnecessary UI complexity for families who only want to use a subset of features. There's no way for families to customize which features appear in their navigation or are accessible to family members.

## Proposed Solution
Implement a full-stack family feature toggle system that:
1. Stores feature preferences at the family level in the database
2. Provides a settings UI for parents to enable/disable features
3. Filters navigation and restricts access based on enabled features
4. Includes AI integration settings in the same interface
5. **Preloads settings server-side via SSR to prevent layout shifts** (no localStorage needed)

## Scope
This change introduces three main capabilities:

### 1. **Family Settings API** (`family-settings`)
Backend REST endpoints to manage family-level feature flags and AI settings.

### 2. **Settings Page UI** (`web-settings-page`)
Frontend settings interface with two tabs:
- **Features Tab**: Toggle switches for 9 features (Tasks, Rewards, Shopping Lists, Recipes, Locations, Memory, Diary, Chat, AI Integration)
- **AI Settings Tab**: Configuration fields for OpenAI-compatible endpoints

### 3. **Feature-Based Navigation Filtering** (`web-feature-filtering`)
Dynamic navigation that shows/hides menu items based on enabled features, with SSR preloading and middleware-based route protection.

## Design Considerations
See [`design.md`](./design.md) for detailed architecture decisions including:
- Database schema design (extensible array vs fixed fields)
- Redux state management integration
- **Server-side rendering (SSR) preloading strategy** (replaces localStorage)
- Middleware-based route protection
- Navigation filtering implementation

## Success Criteria
- ✅ Parents can toggle features on/off from settings page
- ✅ Disabled features are hidden from navigation
- ✅ Settings persist across page refreshes
- ✅ No layout shifts on initial page load
- ✅ All features default to enabled for existing families
- ✅ Child users cannot access settings
- ✅ 100% unit test coverage for Redux code
- ✅ E2E tests cover all CRUD operations

## Non-Goals
- Feature-level analytics or usage tracking
- User-level (vs family-level) feature preferences
- Gradual feature rollout or A/B testing infrastructure
- Deprecating or removing any existing features

## Dependencies
- Requires parent role authorization (already implemented)
- Uses existing family context from Redux store
- Builds on dashboard navigation infrastructure

## Risks
- **Data Migration**: Existing families need default settings created
- **Performance**: Extra database query per request if not properly cached
- **UX Consistency**: Must ensure disabled features can't be accessed via direct URL

## Rollout Plan
1. Deploy backend API endpoints
2. Create migration script to initialize settings for existing families
3. Deploy frontend settings page
4. Deploy navigation filtering with localStorage
5. Monitor for performance issues or edge cases

## Related Work
- Constitution principle: Keep features optional and composable
- Aligns with "family-first" architecture where settings are scoped to families
- Similar pattern could extend to user-level preferences in future