## ADDED Requirements

### Requirement: Real-time Task Event Subscriptions

The web application SHALL subscribe to real-time task events and update the UI automatically when events are received.

#### Scenario: Connect to WebSocket server
- **WHEN** a user navigates to the tasks page
- **THEN** the application SHALL establish a WebSocket connection to the API
- **AND** SHALL authenticate using the user's session token
- **AND** SHALL automatically join the user's personal event room

#### Scenario: Task created event received
- **WHEN** a `task.created` event is received
- **THEN** the application SHALL dispatch the `fetchTasks` Redux thunk
- **AND** the Redux store SHALL update with the new task data
- **AND** the new task SHALL appear in the list without manual refresh

#### Scenario: Task assigned event received
- **WHEN** a `task.assigned` event is received for the current user
- **THEN** the application SHALL dispatch the `fetchTasks` Redux thunk
- **AND** the Redux store SHALL update with the assigned task
- **AND** a toast notification SHALL be displayed with the task name
- **AND** the toast SHALL persist for 5 seconds

#### Scenario: Task completed event received
- **WHEN** a `task.completed` event is received
- **THEN** the application SHALL dispatch the `fetchTasks` Redux thunk
- **AND** the Redux store SHALL update the task status to completed
- **AND** the task status SHALL update to completed in the UI

#### Scenario: Task deleted event received
- **WHEN** a `task.deleted` event is received
- **THEN** the application SHALL dispatch the `fetchTasks` Redux thunk
- **AND** the Redux store SHALL remove the deleted task
- **AND** the task SHALL be removed from the UI

#### Scenario: Connection lost
- **WHEN** the WebSocket connection is lost
- **THEN** the application SHALL attempt to reconnect automatically
- **AND** SHALL display a connection status indicator
- **AND** upon reconnection, SHALL dispatch `fetchTasks` to sync Redux store

### Requirement: Task Assignment Notifications

The web application SHALL display toast notifications using Sonner when tasks are assigned to the current user.

#### Scenario: Direct task assignment notification
- **WHEN** a task is directly assigned to the current user
- **THEN** a success toast SHALL be displayed
- **AND** the toast title SHALL be "New task assigned"
- **AND** the toast description SHALL include the task name
- **AND** the toast SHALL be dismissible

#### Scenario: Role-based task assignment notification
- **WHEN** a task is assigned to the user's role
- **THEN** a success toast SHALL be displayed
- **AND** the toast description SHALL indicate it was assigned to their role
- **AND** the toast SHALL include the task name

#### Scenario: Recurring task generation notification
- **WHEN** a recurring task is generated and assigned to the user
- **THEN** a toast SHALL indicate the task is from a recurring schedule
- **AND** the toast SHALL include the task name
- **AND** the user SHALL be able to click the toast to navigate to the task

#### Scenario: No notification for other users' tasks
- **WHEN** a task event is received for a different user
- **THEN** no toast notification SHALL be displayed
- **AND** the task list SHALL still update if it affects the family view

### Requirement: Connection State Management

The web application SHALL manage WebSocket connection state and provide visual feedback to users.

#### Scenario: Connection established indicator
- **WHEN** the WebSocket connection is successfully established
- **THEN** a subtle online indicator MAY be displayed
- **AND** real-time updates SHALL be enabled

#### Scenario: Connection lost indicator
- **WHEN** the WebSocket connection is lost
- **THEN** a warning message SHALL be displayed
- **AND** the message SHALL indicate real-time updates are paused
- **AND** automatic reconnection SHALL be attempted

#### Scenario: Reconnection success
- **WHEN** the WebSocket connection is re-established after disconnection
- **THEN** the warning message SHALL be dismissed
- **AND** the application SHALL refetch the task list
- **AND** real-time updates SHALL resume

### Requirement: Event Subscription Lifecycle

The web application SHALL properly manage event subscription lifecycle to prevent memory leaks and duplicate subscriptions.

#### Scenario: Subscribe on page mount
- **WHEN** the tasks page component mounts
- **THEN** the WebSocket connection SHALL be established
- **AND** event listeners SHALL be registered for task events
- **AND** the event handlers SHALL have access to Redux dispatch

#### Scenario: Unsubscribe on page unmount
- **WHEN** the user navigates away from the tasks page
- **THEN** event listeners SHALL be removed
- **AND** the WebSocket connection SHALL remain active for other modules
- **AND** no task events SHALL trigger Redux dispatches after unmount

#### Scenario: Re-subscribe on page re-mount
- **WHEN** the user returns to the tasks page
- **THEN** event listeners SHALL be re-registered
- **AND** the application SHALL dispatch `fetchTasks` to sync Redux store
- **AND** real-time updates SHALL resume
