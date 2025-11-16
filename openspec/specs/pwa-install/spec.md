# pwa-install Specification

## Purpose
TBD - created by archiving change add-pwa-notifications. Update Purpose after archive.
## Requirements
### Requirement: Install Prompt Detection
The web application SHALL detect when it can be installed as a PWA.

#### Scenario: BeforeInstallPrompt event available
- **WHEN** browser fires beforeinstallprompt event
- **THEN** application captures the prompt event
- **AND** sets canInstall state to true
- **AND** prevents default browser banner

#### Scenario: Already installed
- **WHEN** application is already installed (display-mode: standalone)
- **THEN** install prompts are not shown
- **AND** canInstall state remains false

#### Scenario: iOS detection
- **WHEN** user is on iOS device
- **THEN** system detects iOS platform
- **AND** checks if already in standalone mode
- **AND** shows iOS-specific install instructions if not installed

### Requirement: Install Prompt Drawer
The web application SHALL display a drawer prompting users to install the app.

#### Scenario: Show install drawer
- **WHEN** user has granted notification permission
- **AND** app is installable
- **AND** user has not dismissed install prompt recently
- **THEN** install drawer appears with translated title and description

#### Scenario: Install button clicked (Android/Desktop)
- **WHEN** user clicks install button on supported platform
- **THEN** captured beforeinstallprompt.prompt() is called
- **AND** user sees browser's native install dialog
- **AND** drawer closes after user responds

#### Scenario: iOS install instructions
- **WHEN** drawer is shown on iOS
- **THEN** custom instructions are displayed
- **AND** share icon and "Add to Home Screen" steps are shown
- **AND** no install button is shown (not supported)

#### Scenario: Dismiss install prompt
- **WHEN** user clicks "Later" or closes drawer
- **THEN** drawer is hidden
- **AND** dismissal is stored in localStorage
- **AND** prompt does not reappear for configured duration (e.g., 7 days)

### Requirement: Install Prompt Translations
The install drawer SHALL display translated content based on user locale.

#### Scenario: English locale
- **WHEN** user locale is en-US
- **THEN** drawer shows English title, description, and instructions

#### Scenario: Dutch locale
- **WHEN** user locale is nl-NL
- **THEN** drawer shows Dutch title, description, and instructions

#### Scenario: Platform-specific translations
- **WHEN** showing iOS instructions
- **THEN** translations include iOS-specific terminology
- **WHEN** showing Android/Desktop
- **THEN** translations use appropriate platform language

### Requirement: Install Success Handling
The application SHALL respond to successful installation.

#### Scenario: App installed successfully
- **WHEN** user completes installation
- **THEN** appinstalled event fires
- **AND** canInstall state is set to false
- **AND** install drawer is closed and not shown again

### Requirement: Testability
The install prompt components SHALL include data-testid attributes for E2E testing.

#### Scenario: Drawer locators
- **WHEN** E2E test accesses install drawer
- **THEN** drawer has data-testid="pwa-install-drawer"
- **AND** install button has data-testid="pwa-install-button"
- **AND** dismiss button has data-testid="pwa-install-dismiss"

#### Scenario: iOS instructions locators
- **WHEN** E2E test checks iOS instructions
- **THEN** instructions container has data-testid="pwa-install-ios-instructions"

