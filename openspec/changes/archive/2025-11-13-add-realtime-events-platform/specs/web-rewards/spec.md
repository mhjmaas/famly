## ADDED Requirements

### Requirement: Real-time Reward Event Subscriptions

The web application SHALL subscribe to real-time reward claim events and update the UI automatically when events are received.

#### Scenario: Connect to WebSocket server
- **WHEN** a user navigates to the rewards page
- **THEN** the application SHALL establish a WebSocket connection to the API
- **AND** SHALL authenticate using the user's session token
- **AND** SHALL automatically join the user's personal event room

#### Scenario: Claim created event received (child)
- **WHEN** a child receives a `claim.created` event for their own claim
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** a toast notification SHALL be displayed confirming the claim
- **AND** the toast SHALL indicate the claim is pending approval

#### Scenario: Approval task created event received (parent)
- **WHEN** a parent receives an `approval_task.created` event
- **THEN** a toast notification SHALL be displayed
- **AND** the toast title SHALL be "New reward approval needed"
- **AND** the toast description SHALL include the child's name and reward name
- **AND** clicking the toast SHALL navigate to the tasks page

#### Scenario: Claim completed event received
- **WHEN** a user receives a `claim.completed` event
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** a toast notification SHALL be displayed
- **AND** the toast SHALL indicate the reward was provided
- **AND** the claim status SHALL update to completed in the UI

#### Scenario: Claim cancelled event received
- **WHEN** a user receives a `claim.cancelled` event
- **THEN** the claims list SHALL automatically refetch from the server
- **AND** the claim SHALL be removed or marked as cancelled in the UI

#### Scenario: Connection lost
- **WHEN** the WebSocket connection is lost
- **THEN** the application SHALL attempt to reconnect automatically
- **AND** upon reconnection, SHALL refetch the current claims list

### Requirement: Reward Claim Notifications

The web application SHALL display contextual toast notifications for different reward claim scenarios based on user role.

#### Scenario: Child claim confirmation
- **WHEN** a child successfully creates a claim
- **THEN** a success toast SHALL be displayed
- **AND** the toast SHALL confirm the reward was claimed
- **AND** the toast SHALL indicate waiting for parent approval

#### Scenario: Parent approval notification
- **WHEN** a parent is notified of a new claim
- **THEN** an info toast SHALL be displayed
- **AND** the toast SHALL show the child's name and requested reward
- **AND** the toast SHALL include the karma cost
- **AND** the toast SHALL be actionable (click to view task)

#### Scenario: Claim fulfillment notification (child)
- **WHEN** a child's claim is marked as completed
- **THEN** a success toast SHALL be displayed
- **AND** the toast SHALL congratulate the child
- **AND** the toast SHALL show the karma deducted

#### Scenario: Claim cancellation notification
- **WHEN** a claim is cancelled
- **THEN** a warning toast SHALL be displayed
- **AND** the toast SHALL indicate the claim was cancelled
- **AND** SHALL show to both the child and any involved parents

### Requirement: Connection State Management

The web application SHALL manage WebSocket connection state for the rewards page.

#### Scenario: Connection established
- **WHEN** the WebSocket connection is successfully established
- **THEN** real-time claim updates SHALL be enabled
- **AND** the user SHALL receive notifications for relevant events

#### Scenario: Connection lost
- **WHEN** the WebSocket connection is lost
- **THEN** a warning SHALL be displayed indicating real-time updates are paused
- **AND** automatic reconnection SHALL be attempted
- **AND** the claims list SHALL still display cached data

#### Scenario: Reconnection
- **WHEN** the WebSocket connection is re-established
- **THEN** the warning SHALL be dismissed
- **AND** the claims list SHALL be refetched
- **AND** real-time updates SHALL resume

### Requirement: Event Subscription Lifecycle

The web application SHALL properly manage reward event subscription lifecycle.

#### Scenario: Subscribe on page mount
- **WHEN** the rewards page component mounts
- **THEN** the WebSocket connection SHALL be established if not already active
- **AND** event listeners SHALL be registered for claim events

#### Scenario: Unsubscribe on page unmount
- **WHEN** the user navigates away from the rewards page
- **THEN** event listeners for reward events SHALL be removed
- **AND** the WebSocket connection SHALL remain active for other modules
- **AND** no reward events SHALL trigger UI updates after unmount

#### Scenario: Multi-page subscriptions
- **WHEN** multiple pages are subscribed to events simultaneously
- **THEN** each page's event handlers SHALL operate independently
- **AND** the WebSocket connection SHALL be shared across all pages
- **AND** events SHALL be delivered to all relevant subscribed pages
