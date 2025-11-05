# tasks-state Specification

## ADDED Requirements

### Requirement: Tasks Redux Slice
The web application MUST provide a Redux slice for centralized task state management with optimistic updates and error handling.

#### Scenario: Initialize tasks state
- **GIVEN** the Redux store is created
- **WHEN** the application initializes
- **THEN** the tasks slice is registered with initial state:
  ```typescript
  {
    tasks: [],
    schedules: [],
    isLoading: false,
    error: null,
    lastFetch: null
  }
  ```

#### Scenario: Fetch tasks async thunk
- **GIVEN** a family member loads the tasks page
- **WHEN** `dispatch(fetchTasks(familyId))` is called
- **THEN** the thunk sets `isLoading: true` and `error: null`
- **AND** it calls `GET /v1/families/{familyId}/tasks`
- **AND** on success, it updates `tasks` array and sets `lastFetch` timestamp
- **AND** it sets `isLoading: false`
- **AND** on failure, it sets `error` with the error message and `isLoading: false`

#### Scenario: Create task with optimistic update
- **GIVEN** a user submits the create task form
- **WHEN** `dispatch(createTask({ familyId, data }))` is called
- **THEN** the new task is immediately added to `tasks` array with a temporary ID
- **AND** the API POST request is sent
- **AND** on success, the temporary task is replaced with the server response (with real ID)
- **AND** on failure, the temporary task is removed and error is set

#### Scenario: Update task with optimistic update
- **GIVEN** a user edits a task
- **WHEN** `dispatch(updateTask({ familyId, taskId, data }))` is called
- **THEN** the task in state is immediately updated with new data
- **AND** the API PATCH request is sent
- **AND** on success, the update is confirmed with server response
- **AND** on failure, the task reverts to previous state and error is set

#### Scenario: Complete task and update karma
- **GIVEN** a user checks a task checkbox with karma metadata
- **WHEN** `dispatch(completeTask({ familyId, taskId, userId, karma }))` is called
- **THEN** the task's `completedAt` is immediately set to current timestamp
- **AND** `dispatch(incrementKarma({ userId, amount: karma }))` is called
- **AND** the API PATCH request is sent
- **AND** on failure, the task and karma are rolled back

#### Scenario: Delete task with optimistic update
- **GIVEN** a user deletes a task
- **WHEN** `dispatch(deleteTask({ familyId, taskId }))` is called
- **THEN** the task is immediately removed from `tasks` array
- **AND** the API DELETE request is sent
- **AND** on failure, the task is restored and error is set

#### Scenario: Fetch schedules async thunk
- **GIVEN** a family member views recurring tasks
- **WHEN** `dispatch(fetchSchedules(familyId))` is called
- **THEN** the thunk calls `GET /v1/families/{familyId}/tasks/schedules`
- **AND** on success, it updates `schedules` array
- **AND** loading and error states are managed appropriately

#### Scenario: Create schedule async thunk
- **GIVEN** a user creates a recurring task
- **WHEN** `dispatch(createSchedule({ familyId, data }))` is called
- **THEN** the thunk calls `POST /v1/families/{familyId}/tasks/schedules`
- **AND** on success, the new schedule is added to `schedules` array
- **AND** appropriate loading and error states are set

#### Scenario: Delete schedule async thunk
- **GIVEN** a user deletes all recurring instances
- **WHEN** `dispatch(deleteSchedule({ familyId, scheduleId }))` is called
- **THEN** the schedule is removed from `schedules` array
- **AND** existing tasks with that `scheduleId` remain orphaned
- **AND** the API DELETE request is sent

### Requirement: Task Selectors
The Redux slice MUST provide selector functions for efficient state access.

#### Scenario: Select all tasks
- **GIVEN** the tasks slice contains task data
- **WHEN** `selectTasks(state)` is called
- **THEN** it returns the complete `tasks` array

#### Scenario: Select task by ID
- **GIVEN** the tasks slice contains multiple tasks
- **WHEN** `selectTaskById(taskId)(state)` is called
- **THEN** it returns the specific task object matching the ID
- **AND** returns `undefined` if not found

#### Scenario: Select loading state
- **GIVEN** an async operation is in progress
- **WHEN** `selectTasksLoading(state)` is called
- **THEN** it returns `true` during fetch operations
- **AND** returns `false` when idle or complete

#### Scenario: Select error state
- **GIVEN** an API operation has failed
- **WHEN** `selectTasksError(state)` is called
- **THEN** it returns the error message string
- **AND** returns `null` when no error

#### Scenario: Select schedules
- **GIVEN** recurring schedules exist
- **WHEN** `selectSchedules(state)` is called
- **THEN** it returns the complete `schedules` array

#### Scenario: Memoized selectors for performance
- **GIVEN** multiple components access task data
- **WHEN** selectors are used
- **THEN** they use memoization to prevent unnecessary re-renders
- **AND** derived data is computed efficiently

### Requirement: State Persistence
The tasks Redux slice MUST handle state hydration and cache invalidation appropriately.

#### Scenario: State resets on logout
- **GIVEN** a user is logged in with tasks loaded
- **WHEN** they log out
- **THEN** the tasks slice is reset to initial state
- **AND** all task and schedule data is cleared

#### Scenario: Stale data detection
- **GIVEN** tasks were fetched more than 5 minutes ago
- **WHEN** the user returns to the tasks page
- **THEN** a fresh fetch is triggered
- **AND** `lastFetch` timestamp is used to determine staleness

#### Scenario: No automatic refetch on navigation
- **GIVEN** tasks were recently fetched (< 5 minutes)
- **WHEN** the user navigates away and returns to tasks page
- **THEN** cached data is displayed immediately
- **AND** no API call is made unless explicitly triggered

### Requirement: Error Recovery
The Redux slice MUST provide mechanisms for error recovery and retry.

#### Scenario: Retry failed fetch
- **GIVEN** a fetch operation failed with network error
- **WHEN** the user manually triggers retry
- **THEN** the error state is cleared
- **AND** `dispatch(fetchTasks(familyId))` is called again

#### Scenario: Clear error state
- **GIVEN** an error exists in state
- **WHEN** a new operation succeeds
- **THEN** the error is automatically cleared

#### Scenario: Rollback on optimistic update failure
- **GIVEN** an optimistic update was applied
- **WHEN** the API call fails
- **THEN** the state reverts to the previous value before the update
- **AND** error is set with failure message

### Requirement: Type Safety
All Redux slice state, actions, and thunks MUST be fully typed with TypeScript.

#### Scenario: State shape is typed
- **GIVEN** the tasks slice is defined
- **WHEN** accessing state properties
- **THEN** TypeScript enforces correct property names and types
- **AND** autocompletion works in editors

#### Scenario: Action payloads are typed
- **GIVEN** a Redux action is dispatched
- **WHEN** passing payload data
- **THEN** TypeScript validates payload structure
- **AND** missing required fields cause compile errors

#### Scenario: Thunk return types are inferred
- **GIVEN** an async thunk is called
- **WHEN** awaiting its result
- **THEN** the return type is correctly inferred
- **AND** type safety is maintained throughout

#### Scenario: Selector return types are typed
- **GIVEN** a selector is used
- **WHEN** accessing the returned data
- **THEN** the return type matches the slice state structure
- **AND** type narrowing works correctly

### Requirement: Integration with Karma Slice
The tasks slice MUST coordinate with the karma slice for reward tracking.

#### Scenario: Dispatch karma increment on task completion
- **GIVEN** a task with `metadata.karma: 15` is completed
- **WHEN** the completion thunk succeeds
- **THEN** `dispatch(incrementKarma({ userId, amount: 15 }))` is called
- **AND** the karma balance updates in the karma slice
- **AND** UI components reflect the new balance

#### Scenario: Dispatch karma decrement on task reopen
- **GIVEN** a completed task with karma is marked incomplete
- **WHEN** the update thunk succeeds
- **THEN** `dispatch(decrementKarma({ userId, amount }))` is called
- **AND** karma is deducted from the user's balance

#### Scenario: No karma dispatch for tasks without karma
- **GIVEN** a task without `metadata.karma` is completed
- **WHEN** the completion succeeds
- **THEN** no karma action is dispatched
- **AND** karma slice state is unchanged

### Requirement: Redux DevTools Support
The tasks slice MUST be compatible with Redux DevTools for debugging.

#### Scenario: Actions appear in DevTools
- **GIVEN** Redux DevTools extension is installed
- **WHEN** task operations are performed
- **THEN** all dispatched actions appear in the DevTools timeline
- **AND** action types are descriptive (e.g., "tasks/fetchTasks/pending")

#### Scenario: State inspection in DevTools
- **GIVEN** Redux DevTools is open
- **WHEN** viewing the tasks slice
- **THEN** current state is displayed with full detail
- **AND** state changes can be time-traveled

#### Scenario: Action payloads visible in DevTools
- **GIVEN** an action is dispatched with payload
- **WHEN** inspecting in DevTools
- **THEN** the full payload is visible and formatted
- **AND** sensitive data (if any) is appropriately redacted

### Requirement: Concurrent Operation Handling
The Redux slice MUST handle multiple concurrent operations safely.

#### Scenario: Debounce rapid filter changes
- **GIVEN** a user rapidly switches between filter tabs
- **WHEN** each switch triggers state updates
- **THEN** all updates are processed in order
- **AND** no race conditions occur

#### Scenario: Handle simultaneous create and fetch
- **GIVEN** a task create operation is in progress
- **WHEN** a fetch operation is also triggered
- **THEN** both operations complete independently
- **AND** the final state reflects both results

#### Scenario: Prevent duplicate fetches
- **GIVEN** a fetch operation is already in progress
- **WHEN** another fetch is triggered for the same family
- **THEN** the second fetch is ignored or queued
- **AND** only one network request is made

### Requirement: Test Coverage for Redux Slice
The tasks slice MUST have comprehensive unit test coverage.

#### Scenario: Test initial state
- **GIVEN** the slice is initialized
- **WHEN** accessing initial state
- **THEN** it matches expected structure with empty arrays and null values

#### Scenario: Test synchronous reducers
- **GIVEN** synchronous actions like `addTask` or `removeTask`
- **WHEN** dispatched with valid payloads
- **THEN** state updates correctly
- **AND** immutability is maintained

#### Scenario: Test async thunk lifecycle
- **GIVEN** an async thunk like `fetchTasks`
- **WHEN** testing pending, fulfilled, and rejected cases
- **THEN** loading and error states update correctly
- **AND** data is populated on success

#### Scenario: Test optimistic update rollback
- **GIVEN** an optimistic update fails
- **WHEN** the error case is tested
- **THEN** state reverts to previous value
- **AND** error is populated

#### Scenario: Test selectors
- **GIVEN** mock state is provided
- **WHEN** selectors are called
- **THEN** they return correct values
- **AND** memoization works as expected

#### Scenario: Test karma integration
- **GIVEN** a task completion with karma
- **WHEN** the thunk is executed
- **THEN** karma actions are dispatched in correct order
- **AND** both task and karma state update

#### Scenario: Achieve 100% code coverage
- **GIVEN** all reducer branches, thunk paths, and selectors
- **WHEN** running unit tests with coverage
- **THEN** code coverage reaches 100%
- **AND** all edge cases are tested
