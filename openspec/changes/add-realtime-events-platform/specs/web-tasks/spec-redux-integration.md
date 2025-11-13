## ADDED Requirements

### Requirement: Redux Store Integration for Real-time Events

The web application SHALL integrate real-time task events with the Redux store to ensure data consistency and 100% test coverage.

#### Scenario: Event handler dispatches Redux thunk
- **WHEN** a real-time task event is received
- **THEN** the event handler SHALL dispatch the appropriate Redux thunk (fetchTasks)
- **AND** the Redux store SHALL update with the latest server data
- **AND** all components subscribed to the store SHALL re-render with new data

#### Scenario: Unit test coverage for event handlers
- **WHEN** unit tests are written for event handlers
- **THEN** tests SHALL verify Redux dispatch calls are made
- **AND** tests SHALL mock the dispatch function
- **AND** tests SHALL verify correct thunk is dispatched with correct parameters
- **AND** test coverage SHALL be 100% for all event handler code

#### Scenario: Event handler has access to dispatch
- **WHEN** the useTaskEvents hook is initialized
- **THEN** the hook SHALL receive the Redux dispatch function via useAppDispatch
- **AND** event callbacks SHALL have closure access to dispatch
- **AND** dispatch SHALL be stable across re-renders to prevent re-subscription

### Requirement: Karma Balance Updates via Redux

The web application SHALL update karma balances in the Redux store when karma events are received.

#### Scenario: Karma awarded event updates store
- **WHEN** a `karma.awarded` event is received
- **THEN** the event handler SHALL dispatch `setKarma` action with new balance
- **AND** the Redux store SHALL update the user's karma balance
- **AND** all karma display components SHALL show the updated balance

#### Scenario: Karma event handler unit tests
- **WHEN** unit tests are written for karma event handlers
- **THEN** tests SHALL verify `setKarma` action is dispatched
- **AND** tests SHALL verify correct userId and balance are passed
- **AND** test coverage SHALL be 100% for karma event handlers

### Requirement: Reward and Claim Updates via Redux

The web application SHALL update rewards and claims in the Redux store when reward events are received.

#### Scenario: Claim created event triggers store update
- **WHEN** a `claim.created` event is received
- **THEN** the event handler SHALL dispatch `fetchClaims` thunk
- **AND** the Redux store SHALL update with the new claim
- **AND** the claims list SHALL display the new claim

#### Scenario: Approval task created triggers task store update
- **WHEN** an `approval_task.created` event is received by a parent
- **THEN** the event handler SHALL dispatch `fetchTasks` thunk
- **AND** the Redux store SHALL update with the new approval task
- **AND** the task SHALL appear in the parent's task list

#### Scenario: Claim completed triggers multiple store updates
- **WHEN** a `claim.completed` event is received
- **THEN** the event handler SHALL dispatch `fetchClaims` thunk
- **AND** SHALL dispatch `fetchKarma` thunk to update karma balance
- **AND** both Redux slices SHALL update with server data

#### Scenario: Reward event handler unit tests
- **WHEN** unit tests are written for reward event handlers
- **THEN** tests SHALL verify all Redux thunks are dispatched
- **AND** tests SHALL verify correct parameters are passed to thunks
- **AND** test coverage SHALL be 100% for reward event handlers
