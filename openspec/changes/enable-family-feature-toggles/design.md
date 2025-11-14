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
2. Fetch settings alongside families in initial load
3. Settings slice is independent of family slice

### Default Behavior
If no settings exist in Redux (first load, new family):
- **All features assumed enabled** (backwards compatibility)
- Settings fetched on first family page load
- Once fetched, cache in Redux for session

## LocalStorage Strategy

### Purpose
Prevent navigation layout shifts during initial render before Redux hydrates.

### Storage Format
```typescript
// Key: "famly-enabled-features-{familyId}"
// Value: JSON array
["tasks", "rewards", "diary", "chat"]
```

### Sync Points
1. **Read on Mount**: `useDashboardNavigation` checks localStorage first
2. **Write on Settings Change**: After successful API update, write to localStorage
3. **Write on Fetch**: After fetching from API, update localStorage
4. **Clear on Logout**: Settings cleared when user logs out

### Cache Invalidation
- localStorage updated immediately after PUT request succeeds
- No TTL needed (settings change infrequently)
- Logout clears all family settings from localStorage

## Navigation Filtering

### Implementation Location
Modify `apps/web/src/hooks/useDashboardNavigation.ts`:

```typescript
export function useDashboardNavigation() {
  const currentFamily = useAppSelector(selectCurrentFamily);
  const enabledFeatures = useAppSelector(selectEnabledFeatures(currentFamily?.familyId));
  
  // Read from localStorage as fallback
  const cachedFeatures = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(`famly-enabled-features-${currentFamily?.familyId}`);
    return stored ? JSON.parse(stored) : null;
  }, [currentFamily?.familyId]);
  
  const activeFeatures = enabledFeatures ?? cachedFeatures ?? ALL_FEATURES_DEFAULT;
  
  const navigationSections = useMemo(
    () => filterNavigationByFeatures(createNavigationSections(), activeFeatures),
    [activeFeatures]
  );
  
  return { navigationSections, validSectionNames };
}
```

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
Add middleware to protected routes:

```typescript
// In each feature's page.tsx server component
async function checkFeatureEnabled(familyId: string, feature: string) {
  const settings = await getSettings(familyId);
  if (!settings.enabledFeatures.includes(feature)) {
    redirect('/app'); // Redirect to dashboard if disabled
  }
}
```

**Design Decision: Client-side vs Server-side Route Protection**
- ✅ **Chosen**: Both layers
  - Navigation filtering (client-side) for UX
  - Server-side check in page.tsx for security
- **Rationale**: Defense in depth. Users shouldn't see disabled features, but direct URLs must also be blocked.

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