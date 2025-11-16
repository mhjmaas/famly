## ADDED Requirements

### Requirement: Push Subscription Persistence
The system SHALL persist push notification subscriptions in MongoDB linked to authenticated users and their devices.

#### Scenario: User subscribes to notifications
- **WHEN** an authenticated user calls `POST /v1/notifications/subscribe` with valid push subscription data
- **THEN** the subscription is stored in the `push_subscriptions` collection with userId, endpoint, keys, and device info
- **AND** a success response is returned

#### Scenario: Duplicate subscription endpoint
- **WHEN** a user attempts to subscribe with an endpoint that already exists
- **THEN** the existing subscription is updated with new data
- **AND** no duplicate entry is created

#### Scenario: User unsubscribes
- **WHEN** an authenticated user calls `DELETE /v1/notifications/unsubscribe` with their endpoint
- **THEN** the subscription is removed from the database
- **AND** a success response is returned

#### Scenario: Unauthorized subscription attempt
- **WHEN** an unauthenticated request is made to subscribe or unsubscribe
- **THEN** the API returns 401 Unauthorized

### Requirement: Subscription Data Validation
The system SHALL validate push subscription data before persisting.

#### Scenario: Valid subscription data
- **WHEN** subscription data includes endpoint, keys.p256dh, and keys.auth
- **THEN** validation passes and data is stored

#### Scenario: Missing required fields
- **WHEN** subscription data is missing endpoint or keys
- **THEN** validation fails with 400 Bad Request
- **AND** error details indicate which fields are missing

#### Scenario: Invalid data types
- **WHEN** subscription fields contain invalid data types (non-string endpoint, etc.)
- **THEN** validation fails with 400 Bad Request

### Requirement: Push Notification Delivery
The system SHALL send push notifications to subscribed users using web-push protocol.

#### Scenario: Send notification to single user
- **WHEN** backend calls notification service with userId and notification payload
- **THEN** the system retrieves all subscriptions for that user
- **AND** sends push notification to each subscription endpoint
- **AND** includes title, body, icon, and optional data in payload

#### Scenario: Handle invalid subscription
- **WHEN** sending to a subscription that has become invalid (410 Gone)
- **THEN** the system removes that subscription from the database
- **AND** logs the removal
- **AND** continues sending to other valid subscriptions

#### Scenario: Handle temporary send failure
- **WHEN** sending fails with a temporary error (network, rate limit)
- **THEN** the system logs the error
- **AND** does not remove the subscription
- **AND** returns error details for retry handling

#### Scenario: Send notification with deep link
- **WHEN** notification includes a target URL in the payload
- **THEN** the notification data contains the URL
- **AND** service worker can access it for navigation on click

### Requirement: Subscription Querying
The system SHALL provide methods to query subscriptions by user.

#### Scenario: Get user subscriptions
- **WHEN** querying subscriptions by userId
- **THEN** all subscriptions for that user are returned
- **AND** results include endpoint, keys, deviceInfo, and timestamps

#### Scenario: Check subscription existence
- **WHEN** checking if a specific endpoint exists
- **THEN** system returns boolean indicating existence

### Requirement: Security and Authorization
The system SHALL enforce authentication and authorization for all subscription operations.

#### Scenario: Authenticated user manages own subscription
- **WHEN** authenticated user subscribes or unsubscribes
- **THEN** operations are performed for their userId only
- **AND** they cannot manage other users' subscriptions

#### Scenario: Internal notification sending
- **WHEN** backend service sends notification
- **THEN** operation is allowed without user authentication
- **AND** requires valid internal service context

### Requirement: VAPID Configuration
The system SHALL use VAPID keys for push notification authentication.

#### Scenario: VAPID keys configured
- **WHEN** server starts with VAPID keys in environment
- **THEN** web-push is initialized with keys
- **AND** public key is available for client subscription

#### Scenario: Missing VAPID keys
- **WHEN** VAPID keys are not configured
- **THEN** notification endpoints return 503 Service Unavailable
- **AND** error message indicates configuration issue
