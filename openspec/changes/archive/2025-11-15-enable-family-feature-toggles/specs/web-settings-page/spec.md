# web-settings-page Specification Delta

## ADDED Requirements

### Requirement: Settings page displays feature toggles and AI configuration
Parents MUST have access to a settings page where they can manage enabled features and configure AI integration.

#### Scenario: Settings page loads with current settings
- **GIVEN** a parent user navigating to `/app/settings`
- **AND** the family has existing settings
- **WHEN** the page loads
- **THEN** the page displays two tabs: "Features" and "AI Settings"
- **AND** the "Features" tab shows all 9 features with their current enabled/disabled state
- **AND** the "AI Settings" tab shows current AI configuration values
- **AND** all data is fetched from the API on page load

#### Scenario: Settings page defaults to Features tab
- **GIVEN** a parent user navigating to `/app/settings` for the first time
- **WHEN** the page loads
- **THEN** the "Features" tab is selected by default
- **AND** the feature toggle list is visible immediately

#### Scenario: Settings page is responsive
- **GIVEN** a parent user viewing the settings page
- **WHEN** the viewport width changes between mobile, tablet, and desktop sizes
- **THEN** the layout adapts following existing app patterns
- **AND** on mobile (<768px), shows single-column full-width layout
- **AND** on tablet and desktop, shows constrained max-width container
- **AND** tab switcher remains centered at all breakpoints

### Requirement: Feature toggles provide immediate visual feedback
Feature toggle switches MUST update immediately when clicked and persist the change to the backend.

#### Scenario: Toggle feature on
- **GIVEN** a parent viewing the Features tab
- **AND** the "Tasks" feature is currently disabled
- **WHEN** the parent clicks the "Tasks" toggle switch
- **THEN** the switch immediately changes to enabled state
- **AND** a success toast notification appears saying "Feature Enabled"
- **AND** the settings are saved to the API in the background
- **AND** the enabled features are updated in localStorage

#### Scenario: Toggle feature off
- **GIVEN** a parent viewing the Features tab
- **AND** the "Rewards" feature is currently enabled
- **WHEN** the parent clicks the "Rewards" toggle switch
- **THEN** the switch immediately changes to disabled state
- **AND** a success toast notification appears saying "Feature Disabled"
- **AND** the settings are saved to the API in the background
- **AND** the enabled features are updated in localStorage

#### Scenario: Toggle handles API failure gracefully
- **GIVEN** a parent toggling a feature
- **AND** the backend API request fails
- **WHEN** the toggle switch changes
- **THEN** the switch reverts to its previous state
- **AND** an error toast notification appears
- **AND** the user can retry the action

### Requirement: Feature list displays descriptive information
Each feature toggle MUST display a label, description, and current state to help parents make informed decisions.

#### Scenario: Feature list shows all features with metadata
- **GIVEN** a parent viewing the Features tab
- **THEN** the page displays 9 feature items with the following structure:
  - "Tasks" - "Manage family tasks and chores"
  - "Rewards" - "Track karma and redeem rewards"
  - "Shopping Lists" - "Collaborate on shopping lists"
  - "Recipes" - "Share and discover family recipes"
  - "Locations" - "Track family member locations and trips"
  - "Memories" - "Create and share family memories"
  - "Diary" - "Personal diary entries for each member"
  - "Chat" - "Family chat and messaging"
  - "AI Integration" - "Enable AI assistant features"
- **AND** each item has a toggle switch reflecting its current state
- **AND** each item uses the translated text from the current locale

### Requirement: AI Settings form validates input
The AI Settings tab MUST validate all fields before allowing submission and provide clear error messages.

#### Scenario: AI Settings form validates required fields
- **GIVEN** a parent viewing the AI Settings tab
- **AND** the form has some fields filled and some empty
- **WHEN** the parent clicks "Save AI Settings"
- **THEN** if any required field is empty, a validation error appears
- **AND** the error message states "All fields are required"
- **AND** the form is not submitted

#### Scenario: AI Settings form validates URL format
- **GIVEN** a parent viewing the AI Settings tab
- **AND** the API Endpoint field contains "not-a-valid-url"
- **WHEN** the parent clicks "Save AI Settings"
- **THEN** a validation error appears
- **AND** the error message states "Please enter a valid API endpoint URL"
- **AND** the form is not submitted

#### Scenario: AI Settings form saves valid configuration
- **GIVEN** a parent viewing the AI Settings tab
- **AND** all fields contain valid values:
  - AI Name: "Jarvis"
  - API Endpoint: "https://api.openai.com/v1"
  - API Secret: "sk-test123"
  - Model Name: "gpt-4"
- **WHEN** the parent clicks "Save AI Settings"
- **THEN** a loading state appears on the button ("Saving...")
- **AND** the settings are sent to the API
- **AND** a success toast appears "AI Settings Saved"
- **AND** the message includes the AI name: "AI settings for Jarvis have been saved successfully"
- **AND** the button returns to normal state

#### Scenario: AI Settings allows empty configuration
- **GIVEN** a parent viewing the AI Settings tab
- **AND** the parent wants to clear AI integration
- **WHEN** the parent enters empty strings for all fields except AI Name
- **AND** clicks "Save AI Settings"
- **THEN** the empty configuration is accepted and saved
- **AND** a success toast appears

#### Scenario: AI Settings form has reset functionality
- **GIVEN** a parent viewing the AI Settings tab
- **AND** the form has custom values
- **WHEN** the parent clicks "Reset to Default"
- **THEN** all fields are cleared to empty strings
- **AND** AI Name resets to "Jarvis"
- **AND** no API request is made until the user explicitly saves

### Requirement: Settings page uses translation keys
All UI text MUST be internationalized and display in the user's selected language (English or Dutch).

#### Scenario: Settings page displays English translations
- **GIVEN** a parent with English locale selected
- **WHEN** viewing the settings page
- **THEN** all text appears in English including:
  - Page title: "Settings"
  - Tab labels: "Features", "AI Settings"
  - Feature labels and descriptions
  - Button labels: "Save AI Settings", "Reset to Default"
  - Toast messages

#### Scenario: Settings page displays Dutch translations
- **GIVEN** a parent with Dutch locale selected
- **WHEN** viewing the settings page
- **THEN** all text appears in Dutch from the nl-NL dictionary
- **AND** the interface remains functional and readable

### Requirement: Settings page integrates with Redux store
The settings page MUST fetch settings from Redux and update Redux when changes are made.

#### Scenario: Settings page fetches from Redux on mount
- **GIVEN** a parent navigating to the settings page
- **WHEN** the page component mounts
- **THEN** the component dispatches `fetchFamilySettings` action
- **AND** displays a loading state while fetching
- **AND** once loaded, displays the settings from Redux state

#### Scenario: Settings page updates Redux on change
- **GIVEN** a parent toggling a feature
- **WHEN** the toggle succeeds on the backend
- **THEN** the Redux store is updated with the new settings
- **AND** the UI reflects the Redux state
- **AND** localStorage is synchronized with the new state

#### Scenario: Settings page handles Redux errors
- **GIVEN** a parent viewing the settings page
- **AND** the Redux fetch fails
- **WHEN** an error occurs
- **THEN** an error message is displayed to the user
- **AND** the user has an option to retry
- **AND** the page remains functional with default values

### Requirement: Settings page uses data-testid for testing
All interactive elements and key sections MUST have data-testid attributes for E2E testing.

#### Scenario: Settings page elements are testable
- **GIVEN** an E2E test suite accessing the settings page
- **THEN** the following elements have data-testid attributes:
  - Page container: `data-testid="settings-page"`
  - Features tab trigger: `data-testid="features-tab-trigger"`
  - AI Settings tab trigger: `data-testid="ai-settings-tab-trigger"`
  - Each feature toggle: `data-testid="feature-toggle-{featureName}"`
  - AI Name input: `data-testid="ai-name-input"`
  - API Endpoint input: `data-testid="api-endpoint-input"`
  - API Secret input: `data-testid="api-secret-input"`
  - Model Name input: `data-testid="model-name-input"`
  - Save button: `data-testid="save-ai-settings-button"`
  - Reset button: `data-testid="reset-ai-settings-button"`

### Requirement: Settings page follows design reference
The visual design MUST match the reference implementation in `reference/v0-famly/components/family-settings-view.tsx` as closely as possible.

#### Scenario: Features tab layout matches reference
- **GIVEN** a parent viewing the Features tab
- **THEN** the layout includes:
  - Card component with icon (CheckCircle2) and title/description header
  - Feature list with left-aligned labels/descriptions and right-aligned switches
  - "About Features" informational card below the main card
- **AND** spacing, padding, and typography match the reference design
- **AND** shadcn Card, Switch, and Label components are used

#### Scenario: AI Settings tab layout matches reference
- **GIVEN** a parent viewing the AI Settings tab
- **THEN** the layout includes:
  - Card component with icon (Bot) and title/description header
  - Stacked input fields with labels and helper text
  - Button group with primary "Save" and secondary "Reset" buttons
  - "About AI Settings" informational card below the main card
- **AND** spacing, padding, and typography match the reference design
- **AND** shadcn Input, Button, and Card components are used

### Requirement: Settings page is protected by authorization
Only parent-role users MUST be able to access the settings page.

#### Scenario: Parent can access settings page
- **GIVEN** a parent user authenticated and logged in
- **WHEN** navigating to `/app/settings`
- **THEN** the settings page loads successfully
- **AND** all features and AI settings are accessible

#### Scenario: Child cannot access settings page
- **GIVEN** a child user authenticated and logged in
- **WHEN** attempting to navigate to `/app/settings`
- **THEN** the user is redirected to the dashboard or shown an error
- **AND** the settings data is not fetched or displayed

#### Scenario: Unauthenticated user cannot access settings page
- **GIVEN** an unauthenticated user
- **WHEN** attempting to navigate to `/app/settings`
- **THEN** the user is redirected to the login page
- **AND** after login, the user may be redirected back to settings if they have parent role

### Requirement: Settings page components are modular
The settings page MUST be split into smaller, focused components for maintainability and testability.

#### Scenario: Settings page component structure
- **GIVEN** the settings page implementation
- **THEN** the following component structure exists:
  - `page.tsx`: Server component for auth and data fetching
  - `SettingsView.tsx`: Client component for tab container
  - `FeaturesTab.tsx`: Features tab content
  - `FeatureToggleCard.tsx`: Individual feature toggle item
  - `AISettingsTab.tsx`: AI settings tab content
  - `AIConfigForm.tsx`: AI configuration form
- **AND** each component has a single clear responsibility
- **AND** components are unit-testable in isolation

