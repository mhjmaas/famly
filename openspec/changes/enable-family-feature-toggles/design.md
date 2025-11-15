# Design Document: Family Feature Toggles

## Architecture Overview
This change introduces a family-scoped settings system managed through three layers:
1. **Data Layer**: MongoDB collection storing feature flags + AI settings per family
2. **Application Layer**: Express routes + services for CRUD operations
3. **Presentation Layer**: React settings page + navigation filtering

## Data Model Design

### Database Schema
We'll create a new `familySettings` collection with the following structure:

```typescript
interface FamilySettings {
  _id: ObjectId;
  familyId: string;  // Foreign key to families collection
  enabledFeatures: string[];  // Array of feature keys
  aiSettings: {
    apiEndpoint: string;
    apiSecret: string;  // Encrypted at rest
    modelName: string;
    aiName: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**Design Decision: Extensible Array vs Fixed Fields**
- ✅ **Chosen**: Array of strings (`enabledFeatures: ["tasks", "rewards", ...]`)
- **Rationale**: Easy to add new features without schema changes. Simple to query ("tasks" in enabledFeatures).
- **Trade-off**: Slightly less type-safe than boolean fields, but MongoDB doesn't enforce schema anyway.

**Available Feature Keys**:
- `"tasks"`
- `"rewards"`
- `"shoppingLists"`
- `"recipes"`
- `"locations"`
- `"memories"`
- `"diary"`
- `"chat"`
- `"aiIntegration"`

**Default Values**:
- All features enabled by default for **new** families
- AI settings empty by default (optional configuration)

### Indexes
```javascript
// Unique index on familyId to ensure one settings doc per family
db.familySettings.createIndex({ familyId: 1 }, { unique: true })
```

## API Design

### Endpoints
All endpoints require authentication and parent role authorization.

```
GET    /v1/families/{familyId}/settings       # Get current settings
PUT    /v1/families/{familyId}/settings       # Update settings (full replace)
PATCH  /v1/families/{familyId}/settings       # Partial update (not in MVP)
```

### Request/Response Format

**GET Response (200)**:
```json
{
  "familyId": "fam_123",
  "enabledFeatures": ["tasks", "rewards", "diary"],
  "aiSettings": {
    "apiEndpoint": "https://api.openai.com/v1",
    "modelName": "gpt-4",
    "aiName": "Jarvis"
  }
}
```

**PUT Request**:
```json
{
  "enabledFeatures": ["tasks", "rewards", "diary"],
  "aiSettings": {
    "apiEndpoint": "https://api.openai.com/v1",
    "apiSecret": "sk-...",
    "modelName": "gpt-4",
    "aiName": "Jarvis"
  }
}
```

**Validation Rules**:
- `enabledFeatures`: Array of valid feature keys (min 0, max 9)
- `aiSettings`: Optional. If provided, all fields required except empty AI settings allowed
- `apiEndpoint`: Must be valid URL if provided
- `apiSecret`: Stored encrypted, never returned in GET responses

### Authorization
- Only parent-role members can GET/PUT settings
- Children get HTTP 403 if they attempt access
- Family membership verified via existing middleware

## Redux State Management

### New Settings Slice
Create `apps/web/src/store/slices/settings.slice.ts`:

```typescript
interface SettingsState {
  settingsByFamily: Record<string, FamilySettings | undefined>;
  isLoading: boolean;
  error: string | null;
}

// Async thunks
export const fetchFamilySettings = createAsyncThunk(...)
export const updateFamilySettings = createAsyncThunk(...)

// Selectors
export const selectEnabledFeatures = (familyId: string) => (state: RootState) => 
  state.settings.settingsByFamily[familyId]?.enabledFeatures ?? ALL_FEATURES_DEFAULT
export const selectIsFeatureEnabled = (familyId: string, feature: string) => (state: RootState) =>
  state.settings.settingsByFamily[familyId]?.enabledFeatures.includes(feature) ?? true
```

**Design Decision: Separate Slice vs Extending Family Slice**
- ✅ **Chosen**: New `settings` slice
- **Rationale**: Settings are conceptually distinct from family membership. Separates concerns for easier testing and maintenance.
- **Trade-off**: One extra reducer, but better isolation.

### Integration with Existing Store
1. Add `settings` to root reducer in `store.ts`
2. **Settings preloaded server-side in root layout** (alongside user/karma)
3. Settings slice is independent of family slice

### Default Behavior
If no settings exist in Redux (first load, new family):
- **All features assumed enabled** (backwards compatibility)
- Settings preloaded via SSR in root layout
- No client-side fetching needed

## Server-Side Rendering Strategy

### Purpose
Prevent navigation layout shifts by preloading settings server-side before first render.

### Implementation
Settings are fetched in the root layout (`apps/web/src/app/[lang]/layout.tsx`) using the Data Access Layer:

```typescript
const { user, karma, settings } = await getUserWithKarmaAndSettings(lang);

preloadedState = {
  user: { profile: user, isLoading: false, error: null },
  karma: { balances: { [user.id]: karma }, isLoading: false, error: null },
  settings: {
    settingsByFamily: familyId && settings ? { [familyId]: settings } : {},
    isLoading: false,
    error: null,
  },
};
```

### Benefits
- **Zero layout shift**: Settings available before first render
- **No localStorage needed**: Server provides fresh data every session
- **Simpler architecture**: No sync logic between localStorage and Redux
- **Better security**: Settings fetched server-side, can't be tampered
- **Follows Next.js patterns**: Uses existing DAL and SSR preloading

## Navigation Filtering

### Implementation Location
Simplified `apps/web/src/hooks/useDashboardNavigation.ts`:

```typescript
export function useDashboardNavigation() {
  const user = useAppSelector(selectUser);
  const currentFamily = useAppSelector(selectCurrentFamily);
  
  // Get familyId from either the full family data or user profile
  const familyId = currentFamily?.familyId || user?.families?.[0]?.familyId;
  
  // Get enabled features from Redux (preloaded via SSR in root layout)
  // Falls back to all features if not loaded (backwards compatibility)
  const enabledFeatures = useAppSelector(selectEnabledFeatures(familyId));
  
  const navigationSections = useMemo(
    () => filterNavigationByFeatures(createNavigationSections(), enabledFeatures),
    [enabledFeatures]
  );
  
  return { navigationSections, validSectionNames };
}
```

**Key Changes from Original Design:**
- Removed localStorage fallback logic
- Removed hydration workarounds (`useState`, `useEffect`)
- Simplified to single Redux selector
- Settings always available from SSR preload

### Filtering Rules
- Features map to navigation items by key:
  - `tasks` → `/app/tasks`
  - `rewards` → `/app/rewards`
  - `shoppingLists` → `/app/shopping-lists`
  - `recipes` → *Not yet in nav (future)*
  - `locations` → `/app/locations`
  - `memories` → `/app/memories`
  - `diary` → `/app/diary`
  - `chat` → `/app/chat`
  - `aiIntegration` → `/app/ai-settings` (renamed to `/app/settings`)

- Settings page itself is **never filtered** (always visible to parents)
- Dashboard home is **never filtered**

### Route Protection
Middleware-based route protection in `apps/web/src/proxy.ts`:

```typescript
// Feature-to-route mapping
const FEATURE_ROUTES: Record<string, string> = {
  tasks: "/app/tasks",
  rewards: "/app/rewards",
  shoppingLists: "/app/shopping-lists",
  diary: "/app/diary",
  chat: "/app/chat",
  locations: "/app/locations",
  memories: "/app/memories",
  aiIntegration: "/app/ai-settings",
};

// In async proxy() function
if (isProtectedRoute && isAuthenticated && sessionCookie) {
  const featureKey = Object.keys(FEATURE_ROUTES).find((key) =>
    pathWithoutLocale.startsWith(FEATURE_ROUTES[key]),
  );

  if (featureKey) {
    const cookieString = `${sessionCookie.name}=${sessionCookie.value}`;
    const settings = await getFamilySettingsForMiddleware(cookieString);

    if (settings && !settings.enabledFeatures.includes(featureKey)) {
      return NextResponse.redirect(dashboardUrl);
    }
  }
}
```

**Design Decision: Middleware vs Per-Page Checks**
- ✅ **Chosen**: Middleware-only route protection
  - Single check per request in middleware
  - Navigation filtering (client-side) for UX
- **Rationale**: 
  - Simpler: No per-page `requireFeatureEnabled()` calls
  - More efficient: One check in middleware vs check on every page
  - Centralized: Single source of truth for access control
  - Follows Next.js patterns: Middleware is designed for this use case

**Key Changes from Original Design:**
- Removed per-page `requireFeatureEnabled()` utility
- Removed `feature-guard.ts` file entirely
- All route protection handled in middleware

## Settings Page UI Design

### Component Structure
```
SettingsPage
├── SettingsTabs
│   ├── FeaturesTab
│   │   ├── FeatureToggleCard
│   │   └── AboutFeaturesCard
│   └── AISettingsTab
│       ├── AIConfigForm
│       └── AboutAICard
```

**Design Decision: Monolithic vs Modular Components**
- ✅ **Chosen**: Split into smaller components
- **Rationale**: Reference design is ~380 lines. Breaking into 5-6 components improves testability and follows existing patterns (see tasks page).
- **Trade-off**: More files, but clearer separation of concerns.

### Component Responsibilities
1. **SettingsPage** (`page.tsx`): Server component, handles auth + data fetching
2. **SettingsView** (client component): Tab container, state management
3. **FeaturesTab**: Feature toggles with descriptions
4. **FeatureToggleCard**: Individual feature with Switch
5. **AISettingsTab**: AI config form
6. **AIConfigForm**: Input fields + validation

### Responsive Design
Follow existing patterns from tasks/family pages:
- **Mobile (<768px)**: Single column, full-width cards
- **Tablet (768-1024px)**: Single column, constrained width
- **Desktop (>1024px)**: Max-width container, same as other pages

### Visual Design
Follow reference design pixel-perfect for:
- Two-tab layout (Features | AI Settings)
- Card-based layout with icons
- Toggle switches for features
- Input fields for AI settings
- Save button positioning

## Translation Strategy

### Dictionary Keys
Add to both `en-US.json` and `nl-NL.json`:

```json
{
  "settings": {
    "title": "Settings",
    "description": "Configure features and AI for your family",
    "tabs": {
      "features": "Features",
      "aiSettings": "AI Settings"
    },
    "features": {
      "title": "Family Features",
      "description": "Enable or disable features for your family to use",
      "tasks": {
        "label": "Tasks",
        "description": "Manage family tasks and chores"
      },
      "rewards": {
        "label": "Rewards",
        "description": "Track karma and redeem rewards"
      },
      // ... etc for all 9 features
      "about": {
        "title": "About Features",
        "content": "Control which features are available to your family members. Disabled features will be hidden from the navigation and cannot be accessed."
      }
    },
    "aiSettings": {
      "title": "AI Configuration",
      "description": "Connect to an OpenAI-compatible API endpoint to enable AI chat features",
      // ... field labels
    },
    "actions": {
      "save": "Save Settings",
      "saving": "Saving...",
      "reset": "Reset to Default"
    },
    "toasts": {
      "featureToggled": "Feature {{action}}",
      "settingsSaved": "Settings saved successfully",
      "error": "Failed to save settings"
    }
  }
}
```

## Testing Strategy

### Unit Tests (100% Coverage Required)
**Redux Slice** (`settings.slice.test.ts`):
- ✅ Initial state
- ✅ fetchFamilySettings thunk (pending, fulfilled, rejected)
- ✅ updateFamilySettings thunk (pending, fulfilled, rejected)
- ✅ Selectors: selectEnabledFeatures, selectIsFeatureEnabled
- ✅ Edge cases: missing family, empty features array

**Validators**:
- ✅ Valid feature arrays
- ✅ Invalid feature keys
- ✅ AI settings validation
- ✅ URL format validation

**Mappers**:
- ✅ Domain to DTO transformation
- ✅ DTO to domain transformation

### E2E Tests
**Backend** (`settings.e2e.test.ts`):
- ✅ GET settings returns default for new family
- ✅ PUT settings stores and retrieves correctly
- ✅ Child role gets 403
- ✅ Invalid feature keys get 400
- ✅ AI settings persist and encrypt secret

**Frontend** (`settings.spec.ts` with Playwright):
- ✅ Settings page loads for parent
- ✅ Toggle feature updates immediately
- ✅ Navigation updates after toggle
- ✅ AI settings form validation
- ✅ Save button enables/disables correctly
- ✅ localStorage syncs after changes
- ✅ Page object pattern with data-testid

## Migration Strategy

### Database Migration Script
Create `scripts/migrate-family-settings.ts`:

```typescript
// For each existing family in `families` collection:
// 1. Check if familySettings document exists
// 2. If not, create with all features enabled (default)
// 3. Set empty AI settings
// 4. Log results

const defaultSettings = {
  enabledFeatures: [
    "tasks", "rewards", "shoppingLists", "recipes",
    "locations", "memories", "diary", "chat", "aiIntegration"
  ],
  aiSettings: {
    apiEndpoint: "",
    apiSecret: "",
    modelName: "",
    aiName: "Jarvis"
  }
};
```

### Deployment Order
1. Deploy API with migration script
2. Run migration for existing families
3. Deploy web app with settings page
4. Monitor for errors/edge cases

## Performance Considerations

### Query Optimization
- Settings fetched once per session (cached in Redux)
- No N+1 queries (one query per family)
- Index on `familyId` ensures fast lookups

### LocalStorage Size
- ~200 bytes per family settings
- Negligible impact on storage quota

### Bundle Size
- Settings page lazy-loaded (only loads when visited)
- Shared UI components from shadcn already in bundle

## Security Considerations

### Authorization
- All endpoints protected by `requireParentRole` middleware
- Family membership verified before any operation
- Child attempts logged as security events

### Data Protection
- AI API secrets encrypted at rest in MongoDB
- Secrets never returned in GET responses (masked or omitted)
- HTTPS required for all API communication

### Client-side Security
- Feature toggles are UX preference, not security boundary
- Server-side validation always enforced
- Direct URL access blocked by route guards

## Error Handling

### API Errors
- 400: Validation errors (invalid features, malformed data)
- 403: Insufficient permissions
- 404: Family not found
- 500: Database errors

### Client Errors
- Network failures: Show retry toast
- Validation errors: Inline field messages
- Unexpected errors: Generic error boundary

### Fallback Behavior
- If settings fetch fails: Assume all features enabled (backwards compat)
- If localStorage corrupted: Fall back to Redux/API
- If Redux empty: Fall back to localStorage or default

## Open Questions
None - design is complete and ready for implementation.

## Related Patterns
- Family-scoped data (similar to family membership, karma)
- Parent authorization (reuse existing middleware)
- Redux async thunks (follow karma/tasks pattern)
- Navigation hooks (extend existing useDashboardNavigation)