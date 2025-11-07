# web-tasks Specification

## Purpose
TBD - created by archiving change implement-tasks-page. Update Purpose after archive.
## Requirements
### Requirement: Tasks Page Component
The web application MUST provide a complete Tasks page component that displays, creates, edits, and manages family tasks.

#### Scenario: Display tasks page with task list
- **GIVEN** an authenticated family member navigates to `/[lang]/app/tasks`
- **WHEN** the page loads
- **THEN** the page displays a task list fetched from `/v1/families/{familyId}/tasks`
- **AND** each task card shows name, optional description, assignment badge, due date (if present), recurring indicator (if applicable), and karma points (if present)
- **AND** the page title is translated according to the current locale

#### Scenario: Display empty state when no tasks exist
- **GIVEN** an authenticated family member with no tasks
- **WHEN** they navigate to the tasks page
- **THEN** an empty state card is displayed
- **AND** the empty state shows appropriate message and "Create Task" button
- **AND** the message adapts based on the current filter (e.g., "You don't have any tasks assigned to you yet" for "My Tasks" filter)

#### Scenario: Display loading state during fetch
- **GIVEN** an authenticated family member
- **WHEN** tasks are being fetched from the API
- **THEN** a loading indicator is displayed
- **AND** the UI is non-interactive during load

#### Scenario: Display error state on fetch failure
- **GIVEN** an authenticated family member
- **WHEN** fetching tasks fails with an API error
- **THEN** an error message is displayed
- **AND** a retry button is provided

#### Scenario: Responsive layout across devices
- **GIVEN** any authenticated family member
- **WHEN** they view the tasks page on mobile (< 768px), tablet (768-1024px), or desktop (> 1024px)
- **THEN** the layout adapts appropriately:
  - Mobile: Single column, compact cards, mobile action button
  - Tablet: Single/dual column based on orientation
  - Desktop: Full header with "New Task" button, multi-column layout

### Requirement: Task Filtering
Family members MUST be able to filter tasks by assignment and completion status.

#### Scenario: Filter to "My Tasks" view
- **GIVEN** an authenticated family member viewing the tasks page
- **WHEN** they select the "My Tasks" filter tab
- **THEN** only tasks assigned to them (by user ID) or their role are displayed
- **AND** unassigned tasks are NOT shown
- **AND** other family members' tasks are NOT shown

#### Scenario: Filter to "All Tasks" view
- **GIVEN** an authenticated family member
- **WHEN** they select the "All Tasks" filter tab
- **THEN** all family tasks are displayed regardless of assignment or completion

#### Scenario: Filter to "Active" tasks
- **GIVEN** an authenticated family member
- **WHEN** they select the "Active" filter tab
- **THEN** only tasks with `completedAt === null` are displayed
- **AND** completed tasks are hidden

#### Scenario: Filter to "Completed" tasks
- **GIVEN** an authenticated family member
- **WHEN** they select the "Completed" filter tab
- **THEN** only tasks with `completedAt !== null` are displayed
- **AND** tasks are grouped by completion date (Today, Yesterday, date)
- **AND** date separators are shown between groups

#### Scenario: Filter state persists during session
- **GIVEN** a user has selected a specific filter
- **WHEN** they navigate away and return to the tasks page
- **THEN** the previously selected filter is NOT remembered (resets to default "My Tasks")

### Requirement: Single Task Creation
Family members MUST be able to create one-time tasks via a dialog interface.

#### Scenario: Open create task dialog
- **GIVEN** an authenticated family member on the tasks page
- **WHEN** they click the "New Task" button (desktop) or floating action button (mobile)
- **THEN** a dialog opens with tabs for "Single Task" and "Recurring Task"
- **AND** "Single Task" tab is selected by default
- **AND** focus is set to the task name input field

#### Scenario: Create task with only required fields
- **GIVEN** the create dialog is open on "Single Task" tab
- **WHEN** the user enters a task name "Take out the trash"
- **AND** clicks "Create Task"
- **THEN** a POST request is sent to `/v1/families/{familyId}/tasks` with `{ name: "Take out the trash", assignment: { type: "unassigned" } }`
- **AND** the dialog closes
- **AND** a success toast appears: "Task created successfully"
- **AND** the new task appears at the top of the task list

#### Scenario: Create task with all optional fields
- **GIVEN** the create dialog is open
- **WHEN** the user:
  - Enters name "Clean the garage"
  - Clicks "+ Description" and enters "Sort tools and sweep floor"
  - Clicks "+ Due" and selects tomorrow's date
  - Clicks "+ Assignment" and selects a specific family member
  - Clicks "+ Karma" and enters "15"
  - Clicks "Create Task"
- **THEN** the task is created with all fields populated
- **AND** the karma points are stored in `metadata.karma`

#### Scenario: Progressive disclosure of optional fields
- **GIVEN** the create dialog is open
- **WHEN** the user clicks "+ Description"
- **THEN** the description textarea appears
- **AND** the "+ Description" button is hidden
- **AND** the same pattern applies for "+ Due", "+ Assignment", "+ Karma"

#### Scenario: Validate required task name
- **GIVEN** the create dialog is open
- **WHEN** the user clicks "Create Task" without entering a name
- **THEN** the form does NOT submit
- **AND** validation feedback is shown on the name field

#### Scenario: Validate karma amount range
- **GIVEN** the create dialog is open with karma field visible
- **WHEN** the user enters a karma value outside 0-1000 range
- **THEN** client-side validation shows an error
- **AND** the create button is disabled until corrected

### Requirement: Recurring Task Creation
Family members MUST be able to create recurring task schedules via a dialog interface.

#### Scenario: Switch to recurring task tab
- **GIVEN** the create dialog is open on "Single Task" tab
- **WHEN** the user clicks the "Recurring Task" tab
- **THEN** the form displays:
  - Task name input
  - Recurring schedule selector (days of week + frequency)
  - Optional description, assignment, and karma fields (progressive disclosure)
- **AND** due date field is NOT available (schedules don't have single due dates)

#### Scenario: Create weekly recurring task
- **GIVEN** the create dialog is on "Recurring Task" tab
- **WHEN** the user:
  - Enters name "Take out trash"
  - Selects days: Monday, Thursday
  - Selects frequency: "Every week"
  - Clicks "Create Task"
- **THEN** a POST request is sent to `/v1/families/{familyId}/tasks/schedules` with:
  ```json
  {
    "name": "Take out trash",
    "schedule": {
      "daysOfWeek": [1, 4],
      "weeklyInterval": 1,
      "startDate": "2025-01-01"  // Today or specified start
    }
  }
  ```
- **AND** the schedule is added to the schedules list in Redux
- **AND** a success toast appears

#### Scenario: Select multiple days for recurring task
- **GIVEN** the recurring schedule selector is visible
- **WHEN** the user clicks "Mon", "Wed", "Fri" buttons
- **THEN** those buttons are highlighted/selected
- **AND** clicking again deselects the day

#### Scenario: Validate at least one day selected
- **GIVEN** the create dialog is on "Recurring Task" tab
- **WHEN** the user attempts to create without selecting any days
- **THEN** validation prevents submission
- **AND** an error message indicates at least one day must be selected

#### Scenario: Select frequency for recurring task
- **GIVEN** the recurring schedule selector is visible
- **WHEN** the user opens the frequency dropdown
- **THEN** options are displayed: "Every week", "Every 2 weeks", "Every 3 weeks", "Every 4 weeks"
- **AND** selecting an option updates `weeklyInterval` to 1, 2, 3, or 4

### Requirement: Task Update
Family members MUST be able to edit existing tasks via a dialog interface.

#### Scenario: Open edit dialog for existing task
- **GIVEN** a task is displayed in the list
- **WHEN** the user clicks the three-dot menu icon and selects "Edit"
- **THEN** the create/edit dialog opens in edit mode
- **AND** dialog title is "Edit Task"
- **AND** all existing task fields are pre-filled in the form
- **AND** optional fields (description, due, assignment, karma) are visible if they have values

#### Scenario: Update task name
- **GIVEN** the edit dialog is open for a task
- **WHEN** the user changes the name to "Clean the kitchen"
- **AND** clicks "Update Task"
- **THEN** a PATCH request is sent to `/v1/families/{familyId}/tasks/{taskId}` with `{ name: "Clean the kitchen" }`
- **AND** the task updates in the list immediately (optimistic update)
- **AND** a success toast appears: "Task updated successfully"

#### Scenario: Add description to existing task
- **GIVEN** the edit dialog is open for a task without description
- **WHEN** the user clicks "+ Description" and enters text
- **AND** clicks "Update Task"
- **THEN** the description is added to the task

#### Scenario: Change task assignment
- **GIVEN** the edit dialog is open
- **WHEN** the user changes assignment from "John" to "All Children"
- **AND** clicks "Update Task"
- **THEN** the task's assignment is updated to `{ type: "role", role: "child" }`

#### Scenario: Add karma to existing task
- **GIVEN** the edit dialog is open for a task without karma
- **WHEN** the user clicks "+ Karma" and enters "20"
- **AND** clicks "Update Task"
- **THEN** the task is updated with `metadata: { karma: 20 }`

#### Scenario: Edit recurring task shows schedule (readonly)
- **GIVEN** a task that was generated from a schedule (has `scheduleId`)
- **WHEN** the user opens the edit dialog
- **THEN** the recurring schedule section is displayed (readonly)
- **AND** the schedule shows selected days and frequency
- **AND** a note indicates "Editing affects this instance only"

### Requirement: Task Completion
Family members MUST be able to mark tasks as complete or incomplete via checkbox interaction.

#### Scenario: Complete task without karma
- **GIVEN** an active task is displayed in the list
- **WHEN** the user clicks the checkbox
- **THEN** a PATCH request is sent with `{ completedAt: "2025-01-15T10:30:00Z" }` (current ISO timestamp)
- **AND** the task updates immediately with visual completion indicators:
  - Checkbox is checked
  - Task name has strikethrough
  - Card has reduced opacity
- **AND** a toast appears: "Task completed"

#### Scenario: Complete task with karma reward
- **GIVEN** an active task with `metadata.karma: 10` is displayed
- **WHEN** the user clicks the checkbox
- **THEN** the task is marked complete
- **AND** the karma balance in Redux is incremented by 10
- **AND** a toast appears: "Great job! You earned 10 karma points"
- **AND** the karma display in the sidebar updates

#### Scenario: Mark completed task as incomplete
- **GIVEN** a completed task is displayed
- **WHEN** the user clicks the checked checkbox
- **THEN** a PATCH request is sent with `{ completedAt: null }`
- **AND** the task updates to show as active (no strikethrough, full opacity)
- **AND** if the task had karma, the karma balance is decremented
- **AND** a toast appears: "Task reopened"

#### Scenario: Completed tasks group by date
- **GIVEN** the "Completed" or "All" filter is active
- **WHEN** tasks have various completion dates
- **THEN** completed tasks are grouped with date separators:
  - "Today" for tasks completed today
  - "Yesterday" for tasks completed yesterday
  - "January 13, 2025" format for older dates
- **AND** active tasks appear above all completed groups

### Requirement: Task Deletion
Family members MUST be able to delete tasks with special handling for recurring instances.

#### Scenario: Delete single (non-recurring) task
- **GIVEN** a task without `scheduleId` is displayed
- **WHEN** the user clicks the menu and selects "Delete"
- **THEN** the task is immediately deleted (optimistic update)
- **AND** a DELETE request is sent to `/v1/families/{familyId}/tasks/{taskId}`
- **AND** a toast appears: "Task deleted"

#### Scenario: Delete recurring task shows confirmation dialog
- **GIVEN** a task with `scheduleId` is displayed (generated from schedule)
- **WHEN** the user clicks the menu and selects "Delete"
- **THEN** an AlertDialog opens with title "Delete Recurring Task"
- **AND** the dialog shows three options:
  - "Cancel" - closes dialog
  - "Delete This Task Only" - deletes single instance
  - "Delete All Recurring Tasks" - deletes the schedule

#### Scenario: Delete single recurring instance
- **GIVEN** the delete confirmation dialog is open for a recurring task
- **WHEN** the user clicks "Delete This Task Only"
- **THEN** only the specific task instance is deleted via DELETE `/v1/families/{familyId}/tasks/{taskId}`
- **AND** the schedule remains active
- **AND** future instances will continue to generate

#### Scenario: Delete all recurring instances
- **GIVEN** the delete confirmation dialog is open for a recurring task
- **WHEN** the user clicks "Delete All Recurring Tasks"
- **THEN** the schedule is deleted via DELETE `/v1/families/{familyId}/tasks/schedules/{scheduleId}`
- **AND** all existing task instances with that `scheduleId` remain but are orphaned
- **AND** no future instances will generate

### Requirement: Task Claiming
Family members MUST be able to claim unassigned and role-based tasks.

#### Scenario: Display claim button for claimable tasks
- **GIVEN** a task with assignment type "unassigned" OR "role" is displayed
- **WHEN** the task is NOT completed
- **THEN** a "Claim Task" button is shown instead of the assignment badge
- **AND** the button is styled with primary colors to draw attention

#### Scenario: Claim unassigned task
- **GIVEN** an unassigned task is displayed with "Claim Task" button
- **WHEN** the user clicks "Claim Task"
- **THEN** a PATCH request updates the task with `{ assignment: { type: "member", memberId: currentUserId } }`
- **AND** the task updates to show the user's name badge
- **AND** the "Claim Task" button is replaced with the assignment badge
- **AND** a toast appears: "You've claimed \"Task Name\""

#### Scenario: Claim role-based task
- **GIVEN** a task assigned to "All Parents" and the user is a parent
- **WHEN** the user clicks "Claim Task"
- **THEN** the task assignment changes to the specific user
- **AND** the task moves to the user's "My Tasks" list

#### Scenario: Do not show claim button for assigned tasks
- **GIVEN** a task assigned to a specific member (not the current user)
- **WHEN** the task is displayed
- **THEN** the "Claim Task" button is NOT shown
- **AND** the member's name badge is displayed instead

### Requirement: Task Display Components
The web application MUST provide consistent, accessible task card components.

#### Scenario: Display task card with all metadata
- **GIVEN** a task with all fields populated (name, description, assignment, due date, karma, recurring)
- **WHEN** the task is rendered
- **THEN** the card displays:
  - Checkbox (unchecked for active, checked for completed)
  - Task name in bold (with strikethrough if completed)
  - Description in muted text below name (if present)
  - Assignment badge showing user name or role
  - Due date badge with calendar icon (red if overdue, default otherwise)
  - "Recurring" badge with repeat icon (if `scheduleId` present)
  - Karma points as large text with sparkle icon on right side
  - Three-dot menu button for Edit/Delete actions

#### Scenario: Display overdue task indicator
- **GIVEN** a task with `dueDate` in the past AND NOT completed
- **WHEN** the task is rendered
- **THEN** the due date badge is styled with destructive variant (red)
- **AND** the card may have additional visual emphasis (border, icon)

#### Scenario: Display karma points prominently
- **GIVEN** a task with `metadata.karma: 25`
- **WHEN** the task is rendered
- **THEN** the karma value is displayed on the right side of the card
- **AND** a filled sparkle icon (⭐) appears next to the number
- **AND** for completed tasks, the karma display is muted/grayed

#### Scenario: Display recurring task indicator
- **GIVEN** a task with `scheduleId` present
- **WHEN** the task is rendered
- **THEN** a "Recurring" badge with repeat icon (🔄) is shown
- **AND** the badge helps users identify schedule-generated tasks

### Requirement: Internationalization Support
All task-related text MUST be fully translatable with support for English and Dutch locales.

#### Scenario: Display page in English
- **GIVEN** the user's locale is set to "en-US"
- **WHEN** they navigate to the tasks page
- **THEN** all text is displayed in English:
  - Page title: "Tasks"
  - Filters: "My Tasks", "All Tasks", "Active", "Completed"
  - Buttons: "New Task", "Create Task", "Claim Task", etc.
  - Empty states, toasts, and error messages

#### Scenario: Display page in Dutch
- **GIVEN** the user's locale is set to "nl-NL"
- **WHEN** they navigate to the tasks page
- **THEN** all text is displayed in Dutch with proper translations

#### Scenario: Format dates according to locale
- **GIVEN** tasks have due dates and completion dates
- **WHEN** dates are displayed
- **THEN** dates are formatted according to the user's locale:
  - English: "January 15, 2025"
  - Dutch: "15 januari 2025"

#### Scenario: Pluralization for karma points
- **GIVEN** karma amounts of 1 or more
- **WHEN** displayed in toasts or badges
- **THEN** proper pluralization is used:
  - English: "1 karma point" vs "10 karma points"
  - Dutch: "1 karmapunt" vs "10 karmapunten"

### Requirement: Accessibility Compliance
The tasks page MUST meet WCAG 2.1 Level AA accessibility standards.

#### Scenario: Keyboard navigation support
- **GIVEN** a user navigating with keyboard only
- **WHEN** they tab through the tasks page
- **THEN** all interactive elements are reachable in logical order:
  - Filter tabs
  - Task checkboxes
  - Task menu buttons
  - "New Task" button
- **AND** focus indicators are clearly visible

#### Scenario: Screen reader support
- **GIVEN** a user with a screen reader
- **WHEN** they navigate the tasks page
- **THEN** all elements have appropriate ARIA labels:
  - Checkboxes: "Mark 'Task Name' as complete"
  - Menu buttons: "Actions for 'Task Name'"
  - Filter tabs: "Filter: My Tasks"
- **AND** status changes are announced (task completed, task created, etc.)

#### Scenario: Focus management in dialogs
- **GIVEN** the create/edit dialog is opened
- **WHEN** it appears
- **THEN** focus is trapped within the dialog
- **AND** focus moves to the first input field
- **AND** Escape key closes the dialog
- **AND** focus returns to the trigger button on close

#### Scenario: Color contrast requirements
- **GIVEN** any text or interactive element on the tasks page
- **WHEN** checked with a contrast tool
- **THEN** all text meets 4.5:1 contrast ratio (normal text)
- **AND** large text meets 3:1 contrast ratio
- **AND** this applies to both light and dark themes

#### Scenario: Touch target sizing
- **GIVEN** the page is viewed on a mobile device
- **WHEN** interactive elements are rendered
- **THEN** all touch targets are at least 44x44 pixels
- **AND** adequate spacing exists between adjacent targets

### Requirement: Error Handling
The web application MUST gracefully handle and display errors from API operations.

#### Scenario: Display API error in toast
- **GIVEN** a user attempts to create a task
- **WHEN** the API returns 400 Bad Request with validation error
- **THEN** an error toast is displayed with the error message
- **AND** the dialog remains open for correction
- **AND** form fields show specific validation errors if available

#### Scenario: Handle network failure
- **GIVEN** a user attempts any task operation
- **WHEN** the network request fails (timeout, no connection)
- **THEN** an error toast appears: "Network error occurred. Please try again."
- **AND** the operation does NOT complete
- **AND** optimistic updates are rolled back

#### Scenario: Handle authorization errors
- **GIVEN** a user's session expires
- **WHEN** they attempt a task operation
- **THEN** they are redirected to the login page
- **AND** after re-authentication, they return to the tasks page

#### Scenario: Retry failed operations
- **GIVEN** an operation failed due to network error
- **WHEN** the user clicks a "Retry" button (if provided)
- **THEN** the operation is attempted again
- **AND** appropriate feedback is shown

### Requirement: Performance Optimization
The tasks page MUST perform efficiently with reasonable task counts.

#### Scenario: Render task list efficiently
- **GIVEN** a family has 50+ tasks
- **WHEN** the tasks page loads
- **THEN** the task list renders within 2 seconds
- **AND** filtering updates are instantaneous (< 100ms)

#### Scenario: Optimistic updates for instant feedback
- **GIVEN** a user performs any task operation (create, update, delete, complete)
- **WHEN** the API request is sent
- **THEN** the UI updates immediately before response
- **AND** if the request fails, the update is rolled back
- **AND** an error message is shown

#### Scenario: Memoize filtered task list
- **GIVEN** the task list is rendered
- **WHEN** non-filter-related state changes (e.g., dialog open/close)
- **THEN** the filtered tasks are NOT re-computed
- **AND** `useMemo` hook prevents unnecessary recalculations

### Requirement: Redux State Integration
The tasks page MUST integrate with Redux for centralized state management and karma synchronization.

#### Scenario: Load tasks into Redux on mount
- **GIVEN** a user navigates to the tasks page
- **WHEN** the component mounts
- **THEN** `dispatch(fetchTasks(familyId))` is called
- **AND** tasks are loaded into Redux state
- **AND** loading state is managed by Redux

#### Scenario: Sync karma on task completion
- **GIVEN** a user completes a task with karma metadata
- **WHEN** the completion succeeds
- **THEN** `dispatch(incrementKarma({ userId, amount }))` is called
- **AND** the karma balance updates in Redux
- **AND** the sidebar karma display updates automatically

#### Scenario: Optimistic updates via Redux actions
- **GIVEN** a user creates a task
- **WHEN** the create action is dispatched
- **THEN** the task is added to Redux state immediately
- **AND** if the API call fails, a rollback action is dispatched
- **AND** the task is removed from state

#### Scenario: Share state across components
- **GIVEN** tasks are loaded in Redux
- **WHEN** other components need task data (e.g., dashboard widget)
- **THEN** they can access the same Redux state
- **AND** changes in one component reflect in others

### Requirement: Missing UI Components
The web application MUST include necessary UI components not currently in the component library.

#### Scenario: Tabs component availability
- **GIVEN** the tasks page needs tabbed navigation for filters and create dialog
- **WHEN** the Tabs component is imported from `@/components/ui/tabs`
- **THEN** it is available and follows shadcn/ui patterns
- **AND** it supports Tabs, TabsList, TabsTrigger, TabsContent subcomponents

#### Scenario: Checkbox component availability
- **GIVEN** the tasks page needs checkboxes for task completion
- **WHEN** the Checkbox component is imported from `@/components/ui/checkbox`
- **THEN** it is available and follows shadcn/ui patterns
- **AND** it supports controlled and uncontrolled modes

#### Scenario: Textarea component availability
- **GIVEN** the create/edit dialog needs a textarea for description
- **WHEN** the Textarea component is imported from `@/components/ui/textarea`
- **THEN** it is available and follows shadcn/ui patterns
- **AND** it matches other form inputs in styling

