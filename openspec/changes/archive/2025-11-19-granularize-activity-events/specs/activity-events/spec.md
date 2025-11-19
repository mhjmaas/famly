# Activity Events Specification Delta

## MODIFIED Requirements

### Requirement: Activity Event Domain Model
The system SHALL provide an `ActivityEvent` entity to track user activities across the platform with granular action detail.

#### Scenario: Activity event structure with detail field
- **WHEN** an activity event is created
- **THEN** it MUST contain:
  - Unique identifier (_id)
  - User ID reference (userId)
  - Title (string, required)
  - Description (string, optional)
  - Event type (ActivityEventType enum)
  - **Event detail (string, optional)** ← NEW: Distinguishes action type
  - Timestamp (createdAt)
  - Optional metadata object with karma value (number, optional)

#### Scenario: Backward compatibility with events missing detail
- **WHEN** an activity event was created before the detail field was added
- **THEN** the system MUST still display it correctly with default behavior
- **AND** the detail field MUST be optional (undefined or null)
- **AND** the web app MUST gracefully handle missing detail values

#### Scenario: Event detail values
- **WHEN** recording an activity event
- **THEN** the detail field MUST use one of these standardized values based on action:
  - `"CREATED"` - Entity was created (task, recipe, shopping list, diary)
  - `"UPDATED"` - Entity was modified
  - `"COMPLETED"` - Task/claim was marked complete
  - `"CLAIMED"` - Reward was claimed
  - `"DELETED"` - Entity was deleted
  - `"GENERATED"` - Task auto-generated from schedule
  - `"AWARDED"` - Karma manually granted

---

### Requirement: Activity Event Recording Service
The system SHALL provide a service utility for other modules to record activity events with granular detail.

#### Scenario: Record activity event with detail parameter
- **WHEN** a module calls the activity event service with userId, type, title, detail, description, and metadata
- **THEN** the system MUST:
  - Create a new ActivityEvent record with the detail field
  - Set createdAt to current timestamp
  - Store the event in the database
  - Return the created event with detail field populated

#### Scenario: Record event without detail (backward compatibility)
- **WHEN** a module calls the activity event service without specifying detail
- **THEN** the system MUST create the event successfully
- **AND** the event's detail field MUST be undefined or null
- **AND** subsequent retrieval MUST not include the detail field if it was not provided

---

### Requirement: Try to archive the change again with the --skip-specs flag since the spec update is failing due to a header mismatch.
The system SHALL record activity events for task operations with specific detail values to distinguish different actions.

#### Scenario: Task creation records CREATED detail
- **WHEN** a user creates a manual task (not from schedule)
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - detail: `"CREATED"` ← NEW: Identifies this as task creation
  - title: task name
  - userId: task creator's ID
  - metadata.karma: 0 or undefined (NOT shown in UI)

#### Scenario: Task completion records COMPLETED detail
- **WHEN** a task is marked complete by any authorized user
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - detail: `"COMPLETED"` ← NEW: Identifies this as task completion
  - title: task name
  - userId: credited member ID (from assignment)
  - metadata.karma: karma value if task has karma metadata (shown in UI)
  - metadata.triggeredBy: user ID if actor differs from credited member

#### Scenario: Auto-generated task records GENERATED detail
- **WHEN** a task is automatically created from a schedule via cron
- **THEN** the system MUST create an activity event with:
  - type: `TASK`
  - detail: `"GENERATED"` ← NEW: Identifies this as schedule-generated
  - title: schedule name
  - userId: schedule creator's ID
  - metadata.karma: not shown in UI for generated tasks

---

### Requirement: Shopping List Event Recording with Detail
The system SHALL record shopping list activity events with specific detail values.

#### Scenario: Shopping list creation records CREATED detail
- **WHEN** a user creates a shopping list
- **THEN** the system MUST create an activity event with:
  - type: `SHOPPING_LIST`
  - detail: `"CREATED"` ← NEW: Identifies this as shopping list creation
  - title: shopping list name
  - userId: creator's ID
  - metadata.karma: not shown in UI

---

### Requirement: Recipe Event Recording with Detail
The system SHALL record recipe activity events with specific detail values.

#### Scenario: Recipe creation records CREATED detail
- **WHEN** a user creates a recipe
- **THEN** the system MUST create an activity event with:
  - type: `RECIPE`
  - detail: `"CREATED"` ← NEW: Identifies this as recipe creation
  - title: recipe name
  - userId: creator's ID
  - metadata.karma: not shown in UI

---

### Requirement: Diary Event Recording with Detail
The system SHALL record personal diary activity events with specific detail values.

#### Scenario: Diary entry creation records CREATED detail
- **WHEN** a user creates a personal diary entry
- **THEN** the system MUST create an activity event with:
  - type: `DIARY`
  - detail: `"CREATED"` ← NEW: Identifies this as diary entry creation
  - title: may include entry preview or "Diary Entry"
  - userId: diary author's ID
  - metadata.karma: not shown in UI

---

### Requirement: Family Diary Event Recording with Detail
The system SHALL record family diary activity events with specific detail values.

#### Scenario: Family diary entry creation records CREATED detail
- **WHEN** a user creates a family diary entry
- **THEN** the system MUST create an activity event with:
  - type: `FAMILY_DIARY`
  - detail: `"CREATED"` ← NEW: Identifies this as family diary entry creation
  - title: may include entry preview or "Family Diary Entry"
  - userId: entry author's ID
  - metadata.karma: not shown in UI

---

### Requirement: Reward Event Recording with Detail
The system SHALL record reward activity events with specific detail values.

#### Scenario: Reward claim records CLAIMED detail
- **WHEN** a user claims/creates a reward claim
- **THEN** the system MUST create an activity event with:
  - type: `REWARD`
  - detail: `"CLAIMED"` ← NEW: Identifies this as reward claim action
  - title: reward name
  - userId: member claiming the reward's ID
  - metadata.karma: negative value representing deduction (shown in UI)

#### Scenario: Reward claim completion records COMPLETED detail
- **WHEN** a reward claim is marked complete/approved
- **THEN** the system MUST create an activity event with:
  - type: `REWARD`
  - detail: `"COMPLETED"` ← NEW: Identifies this as reward claim completion
  - title: reward name
  - userId: member who earned the reward's ID
  - metadata.karma: not shown in UI for completion events

---

### Requirement: Karma Event Recording with Detail
The system SHALL record karma activity events with specific detail values.

#### Scenario: Manual karma grant records AWARDED detail
- **WHEN** karma is manually granted to a user
- **THEN** the system MUST create an activity event with:
  - type: `KARMA`
  - detail: `"AWARDED"` ← NEW: Identifies this as manual karma award
  - title: description of why karma was awarded
  - userId: user receiving the karma
  - metadata.karma: positive value representing amount awarded (shown in UI)

---

### Requirement: Activity Event DTO
The system SHALL provide a data transfer object for API responses that includes the detail field.

#### Scenario: DTO structure with detail field
- **WHEN** returning activity events via API
- **THEN** each ActivityEventDTO MUST contain:
  - id (string, converted from ObjectId)
  - userId (string, converted from ObjectId)
  - type (ActivityEventType)
  - **detail (string, optional)** ← NEW
  - title (string)
  - description (string or null)
  - metadata (object with karma number or null)
  - createdAt (ISO 8601 timestamp string)

---

## ADDED Requirements

### Requirement: Conditional Karma Display in Activity Timeline
The web app MUST conditionally display karma indicators based on both event type AND detail to avoid misleading presentation.

#### Scenario: Hide karma for task creation events
- **WHEN** an activity event with type=TASK and detail=CREATED is displayed
- **THEN** the system MUST NOT show karma indicators, badges, or icons
- **AND** the task creation event MUST appear as a neutral activity without implied reward

#### Scenario: Show karma for task completion events
- **WHEN** an activity event with type=TASK and detail=COMPLETED is displayed
- **AND** metadata.karma > 0
- **THEN** the system MUST show karma badge with the earned amount
- **AND** use the appropriate icon and color for karma earning

#### Scenario: Show negative karma for reward claim events
- **WHEN** an activity event with type=REWARD and detail=CLAIMED is displayed
- **AND** metadata.karma < 0
- **THEN** the system MUST show karma deduction with the amount
- **AND** use appropriate styling to indicate karma cost

#### Scenario: Hide karma for other creation events
- **WHEN** an activity event with detail=CREATED is displayed for type=SHOPPING_LIST, RECIPE, DIARY, or FAMILY_DIARY
- **THEN** the system MUST NOT show karma indicators regardless of metadata.karma value

#### Scenario: Graceful handling of missing detail field
- **WHEN** an activity event without a detail field is displayed (legacy events)
- **THEN** the system MUST fall back to type-only logic
- **AND** continue to show karma indicators if present (current behavior)
- **AND** this MUST not cause errors or break the timeline

#### Scenario: Detail-based icon selection (optional enhancement)
- **WHEN** rendering activity timeline icons
- **THEN** the system MAY use detail to select more specific icons
- **AND** examples:
  - TASK + CREATED → "Plus circle" icon (creation)
  - TASK + COMPLETED → "Check circle" icon (completion)
  - TASK + DELETED → "Trash" icon (deletion)
  - (Implementation is optional in Phase 1)

---

## UNCHANGED Requirements

All other requirements from the `activity-events` specification remain unchanged:
- Activity Event Retrieval
- Date Range Filtering
- Database Indexing (may need `(userId, detail, createdAt)` compound index for future filtering)
