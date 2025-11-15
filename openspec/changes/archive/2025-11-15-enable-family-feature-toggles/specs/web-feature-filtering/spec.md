# web-feature-filtering Specification Delta

## ADDED Requirements

### Requirement: Navigation menu filters based on enabled features
The dashboard navigation MUST dynamically show or hide menu items based on which features are enabled for the current family.

#### Scenario: Navigation shows only enabled features
- **GIVEN** a family with only "tasks" and "diary" features enabled
- **WHEN** a parent views the dashboard navigation
- **THEN** the navigation displays menu items for:
  - Dashboard (always visible)
  - Tasks (under Family section)
  - Diary (under Personal section)
  - Settings (always visible for parents)
- **AND** the navigation does NOT display:
  - Rewards
  - Shopping Lists
  - Recipes
  - Locations
  - Memories
  - Chat
  - AI Integration

#### Scenario: Navigation shows all features when all enabled
- **GIVEN** a family with all features enabled
- **WHEN** a user views the dashboard navigation
- **THEN** all 9 feature menu items are visible
- **AND** the Dashboard and Settings items are also visible
- **AND** no menu items are hidden

#### Scenario: Navigation shows no optional features when all disabled
- **GIVEN** a family with all features disabled (empty `enabledFeatures` array)
- **WHEN** a user views the dashboard navigation
- **THEN** only Dashboard and Settings menu items are visible
- **AND** the Family and Personal sections are empty or hidden
- **AND** the interface remains functional

#### Scenario: Navigation updates when features change
- **GIVEN** a parent viewing the dashboard with certain features enabled
- **WHEN** the parent toggles a feature off in settings
- **THEN** the navigation updates immediately to hide that feature's menu item
- **AND** if the user was on that feature's page, they are redirected to dashboard
- **AND** the change persists across page refreshes

### Requirement: LocalStorage caches enabled features
Enabled features MUST be stored in localStorage to prevent navigation layout shifts during initial page load before Redux hydrates.

#### Scenario: LocalStorage stores enabled features on settings change
- **GIVEN** a parent updating family settings
- **WHEN** the settings are successfully saved to the API
- **THEN** the enabled features array is stored in localStorage with key `famly-enabled-features-{familyId}`
- **AND** the value is a JSON-encoded array of feature keys
- **AND** the cache is immediately available for the next page load

#### Scenario: LocalStorage is read before Redux hydration
- **GIVEN** a user refreshing the page or navigating to dashboard
- **WHEN** the initial React render occurs
- **THEN** the navigation hook reads from localStorage first
- **AND** displays the cached enabled features immediately
- **AND** prevents layout shift when Redux state loads
- **AND** once Redux loads, synchronizes with the server state if different

#### Scenario: LocalStorage is updated when Redux state changes
- **GIVEN** the Redux store receives updated settings from the API
- **WHEN** the `fetchFamilySettings` action completes
- **THEN** localStorage is updated with the new enabled features
- **AND** the key is `famly-enabled-features-{familyId}`
- **AND** subsequent page loads use the updated cache

#### Scenario: LocalStorage is cleared on logout
- **GIVEN** a user logged in with cached settings
- **WHEN** the user logs out
- **THEN** all localStorage entries for family settings are cleared
- **AND** the keys matching pattern `famly-enabled-features-*` are removed
- **AND** the next login starts with a fresh cache

#### Scenario: LocalStorage handles multi-family scenarios
- **GIVEN** a user who is a member of multiple families
- **WHEN** switching between families
- **THEN** the correct localStorage entry for each family is used
- **AND** each family's settings are cached separately by `familyId`
- **AND** navigation updates to reflect the active family's settings

### Requirement: Feature filtering uses predictable fallback behavior
When enabled features cannot be determined, the system MUST default to showing all features to avoid breaking functionality.

#### Scenario: All features shown when localStorage is missing
- **GIVEN** a new user or cleared browser cache
- **AND** Redux state has not yet loaded
- **WHEN** the navigation renders
- **THEN** all feature menu items are visible (safe default)
- **AND** once Redux loads with actual settings, navigation updates

#### Scenario: All features shown when API fetch fails
- **GIVEN** the API request for family settings fails
- **AND** no localStorage cache exists
- **WHEN** the navigation renders
- **THEN** all feature menu items are visible
- **AND** an error notification is shown to the user
- **AND** the user retains access to all features

#### Scenario: LocalStorage cache used when API is slow
- **GIVEN** localStorage contains cached enabled features
- **AND** the API request is slow or pending
- **WHEN** the navigation renders
- **THEN** the cached features from localStorage are displayed immediately
- **AND** no layout shift occurs
- **AND** once the API responds, navigation syncs to server state if different

### Requirement: Feature access is enforced at route level
Attempting to access a disabled feature via direct URL MUST result in redirection or error.

#### Scenario: Direct URL access to disabled feature redirects
- **GIVEN** a family with "rewards" feature disabled
- **WHEN** a user navigates directly to `/app/rewards` via URL
- **THEN** the page checks if the feature is enabled
- **AND** the user is redirected to `/app` (dashboard)
- **AND** a toast notification appears: "This feature is not enabled for your family"

#### Scenario: Direct URL access to enabled feature succeeds
- **GIVEN** a family with "tasks" feature enabled
- **WHEN** a user navigates directly to `/app/tasks` via URL
- **THEN** the page loads normally
- **AND** no redirection occurs

#### Scenario: Feature check happens server-side
- **GIVEN** a user attempting to access any feature page
- **WHEN** the page server component renders
- **THEN** the server checks family settings before rendering
- **AND** performs the feature-enabled check
- **AND** redirects if disabled, before any client-side rendering

### Requirement: Navigation hook integrates Redux and localStorage
The `useDashboardNavigation` hook MUST be updated to consume enabled features from Redux and localStorage.

#### Scenario: Navigation hook reads from multiple sources
- **GIVEN** the `useDashboardNavigation` hook is called
- **THEN** it attempts to read enabled features in this order:
  1. Redux state (if loaded)
  2. localStorage cache (if available)
  3. Default to all features
- **AND** returns filtered navigation sections
- **AND** provides the list of valid section names

#### Scenario: Navigation hook provides filtered sections
- **GIVEN** a family with certain features enabled
- **WHEN** the hook processes the navigation
- **THEN** it filters out menu items where the feature is disabled
- **AND** maintains the original navigation structure
- **AND** preserves section hierarchy (Family, Personal)
- **AND** returns only the items that should be visible

#### Scenario: Navigation hook maintains referential stability
- **GIVEN** the enabled features have not changed
- **WHEN** the component re-renders
- **THEN** the `navigationSections` array maintains the same reference
- **AND** unnecessary re-renders are prevented
- **AND** useMemo is used for memoization

### Requirement: Feature mapping is consistent across the application
Feature keys MUST consistently map to the same navigation items and routes throughout the application.

#### Scenario: Feature keys map to navigation items
- **GIVEN** the feature key `"tasks"`
- **THEN** it maps to navigation item with `href: "/app/tasks"` and name `"tasks"`
- **AND** toggling this feature affects the Tasks menu item

- **GIVEN** the feature key `"rewards"`
- **THEN** it maps to navigation item with `href: "/app/rewards"` and name `"rewards"`

- **GIVEN** the feature key `"shoppingLists"`
- **THEN** it maps to navigation item with `href: "/app/shopping-lists"` and name `"shoppingLists"`

- **GIVEN** the feature key `"recipes"`
- **THEN** it maps to navigation item with `href: "/app/recipes"` (not yet in navigation, future)

- **GIVEN** the feature key `"locations"`
- **THEN** it maps to navigation item with `href: "/app/locations"` and name `"locations"`

- **GIVEN** the feature key `"memories"`
- **THEN** it maps to navigation item with `href: "/app/memories"` and name `"memories"`

- **GIVEN** the feature key `"diary"`
- **THEN** it maps to navigation item with `href: "/app/diary"` and name `"diary"`

- **GIVEN** the feature key `"chat"`
- **THEN** it maps to navigation item with `href: "/app/chat"` and name `"chat"`

- **GIVEN** the feature key `"aiIntegration"`
- **THEN** it enables AI-related features but does not map to a specific menu item (AI is configured in settings)

### Requirement: Settings page is never filtered
The Settings menu item MUST always be visible to parents regardless of feature toggles.

#### Scenario: Settings always visible to parents
- **GIVEN** a parent user with any combination of enabled features
- **WHEN** viewing the navigation
- **THEN** the Settings menu item is always present
- **AND** it is not subject to feature filtering
- **AND** clicking it navigates to `/app/settings`

#### Scenario: Dashboard home is never filtered
- **GIVEN** any user with any combination of enabled features
- **WHEN** viewing the navigation
- **THEN** the Dashboard home menu item is always present
- **AND** it is not subject to feature filtering
- **AND** clicking it navigates to `/app`

### Requirement: Navigation sections collapse when empty
Navigation sections with no enabled items MUST be hidden or collapsed to avoid empty UI sections.

#### Scenario: Family section hidden when all family features disabled
- **GIVEN** a family with all Family features disabled (tasks, rewards, shopping lists, locations, memories)
- **WHEN** viewing the navigation
- **THEN** the "Family" section header is not displayed
- **AND** no empty section appears in the UI

#### Scenario: Personal section hidden when all personal features disabled
- **GIVEN** a family with all Personal features disabled (diary, chat)
- **WHEN** viewing the navigation
- **THEN** the "Personal" section header is not displayed
- **AND** the Settings item is still visible (not part of Personal for filtering purposes)

#### Scenario: Sections remain visible when at least one feature enabled
- **GIVEN** a family with only "tasks" enabled in the Family section
- **WHEN** viewing the navigation
- **THEN** the "Family" section header is displayed
- **AND** only the Tasks item appears under it

### Requirement: Feature filtering is tested with data-testid attributes
Navigation filtering behavior MUST be verifiable via E2E tests using data-testid attributes.

#### Scenario: Navigation items have feature-specific test IDs
- **GIVEN** the navigation menu rendering
- **THEN** each feature-based menu item has a data-testid attribute:
  - Tasks: `data-testid="nav-item-tasks"`
  - Rewards: `data-testid="nav-item-rewards"`
  - Shopping Lists: `data-testid="nav-item-shopping-lists"`
  - Locations: `data-testid="nav-item-locations"`
  - Memories: `data-testid="nav-item-memories"`
  - Diary: `data-testid="nav-item-diary"`
  - Chat: `data-testid="nav-item-chat"`
- **AND** E2E tests can assert presence/absence of these elements

