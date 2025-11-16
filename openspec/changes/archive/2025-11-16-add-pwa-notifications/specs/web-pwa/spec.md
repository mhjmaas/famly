## ADDED Requirements

### Requirement: Notification Redux State Management
The web application SHALL manage notification state using Redux Toolkit.

#### Scenario: Initial state
- **WHEN** Redux store is initialized
- **THEN** notifications state includes subscription: null, permissionStatus: 'default', isSubscribed: false, showPermissionDrawer: false, showInstallDrawer: false, canInstall: false, isLoading: false, error: null

#### Scenario: Check subscription status
- **WHEN** checkSubscriptionStatus async thunk is dispatched
- **THEN** current browser subscription is retrieved
- **AND** backend is queried for subscription existence
- **AND** state is updated with isSubscribed boolean

#### Scenario: Subscribe to notifications
- **WHEN** subscribeToNotifications async thunk is dispatched with permission granted
- **THEN** service worker subscription is created
- **AND** subscription is sent to backend API
- **AND** state is updated with subscription and isSubscribed: true

#### Scenario: Unsubscribe from notifications
- **WHEN** unsubscribeFromNotifications async thunk is dispatched
- **THEN** browser subscription is unsubscribed
- **AND** backend API is called to remove subscription
- **AND** state is updated with subscription: null and isSubscribed: false

#### Scenario: Set permission status
- **WHEN** permission status is detected or changes
- **THEN** permissionStatus state is updated ('default', 'granted', or 'denied')

#### Scenario: Show/hide permission drawer
- **WHEN** showPermissionDrawer or hidePermissionDrawer action is dispatched
- **THEN** showPermissionDrawer boolean is updated accordingly

#### Scenario: Show/hide install drawer
- **WHEN** showInstallDrawer or hideInstallDrawer action is dispatched
- **THEN** showInstallDrawer boolean is updated accordingly

#### Scenario: Set install capability
- **WHEN** setCanInstall action is dispatched with boolean
- **THEN** canInstall state is updated

### Requirement: Redux State Testing
The notifications Redux slice SHALL have 100% unit test coverage.

#### Scenario: Test initial state
- **WHEN** tests verify initial state
- **THEN** all default values are asserted

#### Scenario: Test synchronous reducers
- **WHEN** each synchronous action is dispatched
- **THEN** state changes are verified

#### Scenario: Test async thunk pending state
- **WHEN** async thunk enters pending state
- **THEN** isLoading is true and error is null

#### Scenario: Test async thunk fulfilled state
- **WHEN** async thunk succeeds
- **THEN** isLoading is false and data is updated

#### Scenario: Test async thunk rejected state
- **WHEN** async thunk fails
- **THEN** isLoading is false and error contains message

### Requirement: Service Worker Registration
The web application SHALL register a service worker to handle push notifications.

#### Scenario: Register service worker on mount
- **WHEN** dashboard layout mounts
- **AND** notifications are supported
- **THEN** service worker is registered at /sw.js
- **AND** registration is stored for later use

#### Scenario: Get existing subscription
- **WHEN** service worker is registered
- **THEN** application checks for existing push subscription
- **AND** updates Redux state accordingly

#### Scenario: Browser not supported
- **WHEN** Push API is not supported
- **THEN** service worker registration is skipped
- **AND** notification features are hidden from UI

### Requirement: Permission Request Flow
The web application SHALL guide users through notification permission request.

#### Scenario: Show permission drawer for new users
- **WHEN** authenticated user accesses dashboard
- **AND** permission status is 'default'
- **AND** drawer has not been dismissed recently
- **THEN** permission drawer is displayed with benefits explanation

#### Scenario: Request permission
- **WHEN** user clicks "Allow" in permission drawer
- **THEN** browser's permission dialog is triggered
- **AND** result is captured and stored in Redux state

#### Scenario: Permission granted
- **WHEN** user grants permission
- **THEN** subscribeToNotifications thunk is dispatched
- **AND** permission drawer closes
- **AND** install drawer may appear if app is installable

#### Scenario: Permission denied
- **WHEN** user denies permission
- **THEN** permissionStatus is set to 'denied'
- **AND** permission drawer closes
- **AND** dismissal is stored to avoid re-prompting

#### Scenario: Dismiss permission drawer
- **WHEN** user clicks "Not Now"
- **THEN** drawer closes
- **AND** dismissal timestamp is stored in localStorage
- **AND** drawer does not reappear for configured duration

### Requirement: Permission Drawer Translations
The permission drawer SHALL display fully translated content.

#### Scenario: English translations
- **WHEN** user locale is en-US
- **THEN** drawer shows English title: "Enable Notifications"
- **AND** description explains benefits in English
- **AND** button labels are in English

#### Scenario: Dutch translations
- **WHEN** user locale is nl-NL
- **THEN** drawer shows Dutch title, description, and buttons

#### Scenario: Benefit points translation
- **WHEN** drawer lists notification benefits
- **THEN** each benefit point is translated
- **AND** includes: stay updated, instant alerts, never miss events

### Requirement: Dashboard Integration
The notification system SHALL integrate with the dashboard layout.

#### Scenario: Check on dashboard load
- **WHEN** user navigates to dashboard
- **THEN** useEffect checks notification support
- **AND** dispatches checkSubscriptionStatus
- **AND** determines whether to show permission drawer

#### Scenario: Show notification status indicator
- **WHEN** user is subscribed to notifications
- **THEN** bell icon or indicator shows "active" state
- **WHEN** user is not subscribed
- **THEN** indicator shows "inactive" state

#### Scenario: Manual subscription toggle
- **WHEN** user clicks notification status indicator
- **THEN** if subscribed, confirm unsubscribe dialog appears
- **WHEN** confirmed
- **THEN** unsubscribeFromNotifications is dispatched

### Requirement: E2E Test Coverage
The notification features SHALL have E2E tests using Page Object pattern.

#### Scenario: Page Object for notifications
- **WHEN** E2E tests are written
- **THEN** NotificationsPage class provides locators and helpers
- **AND** includes: permissionDrawer, allowButton, denyButton, subscriptionIndicator

#### Scenario: Test permission flow
- **WHEN** E2E test runs permission flow
- **THEN** test opens permission drawer
- **AND** grants permission via helper method
- **AND** verifies subscription indicator updates

#### Scenario: Test unsubscribe flow
- **WHEN** E2E test runs unsubscribe
- **THEN** test clicks subscription indicator
- **AND** confirms unsubscribe
- **AND** verifies indicator shows inactive state

### Requirement: Error Handling
The notification system SHALL handle errors gracefully.

#### Scenario: API subscription fails
- **WHEN** POST /v1/notifications/subscribe returns error
- **THEN** Redux state captures error message
- **AND** user sees toast notification with error
- **AND** subscription state reverts to false

#### Scenario: Service worker registration fails
- **WHEN** service worker registration throws error
- **THEN** error is logged to console
- **AND** notification features are disabled
- **AND** user sees fallback message

#### Scenario: Permission request fails
- **WHEN** browser permission request throws error
- **THEN** error is captured and logged
- **AND** user sees error message
- **AND** can retry permission request

### Requirement: Notification Click Handling
The service worker SHALL handle notification clicks to navigate to relevant content.

#### Scenario: Notification with target URL
- **WHEN** notification includes target URL in data
- **AND** user clicks notification
- **THEN** service worker opens or focuses app window
- **AND** navigates to target URL

#### Scenario: Notification without target URL
- **WHEN** notification has no target URL
- **AND** user clicks notification
- **THEN** service worker opens or focuses app at dashboard

#### Scenario: Multiple notifications
- **WHEN** user has multiple notifications
- **AND** clicks one
- **THEN** only the clicked notification closes
- **AND** navigation goes to clicked notification's target

### Requirement: Testability with Data Attributes
All notification UI components SHALL include data-testid attributes.

#### Scenario: Permission drawer testids
- **WHEN** E2E test needs to interact with permission drawer
- **THEN** drawer has data-testid="pwa-permission-drawer"
- **AND** allow button has data-testid="pwa-permission-allow"
- **AND** dismiss button has data-testid="pwa-permission-dismiss"

#### Scenario: Subscription indicator testid
- **WHEN** E2E test checks subscription status
- **THEN** indicator has data-testid="notification-subscription-indicator"

#### Scenario: Benefit list testids
- **WHEN** E2E test verifies drawer content
- **THEN** benefits container has data-testid="pwa-permission-benefits"
