## MODIFIED Requirements

### Requirement: Task Completion
Completion credit MUST follow the task assignment so the correct member receives rewards regardless of who triggered the action.
#### Scenario: Credit assigned member when completing
- **GIVEN** a task assigned to a specific member (`assignment.type: "member"`)
- **WHEN** any authorized user marks it complete via `PATCH /v1/families/{familyId}/tasks/{taskId}` with `completedAt`
- **THEN** the response's `completedBy` field MUST equal the assignment's `memberId`
- **AND** the stored task document MUST persist that credited member in `completedBy`
- **AND** karma hooks MUST use that member ID when awarding/deducting karma.

#### Scenario: Parent completes child-assigned task
- **GIVEN** a task assigned to Child A and a parent user for the same family
- **WHEN** the parent sends `PATCH ... { completedAt: now }`
- **THEN** the API responds 200 with `completedBy` set to Child A's user ID
- **AND** the parent ID MUST be captured separately as the actor in emitted events (see Event section)
- **AND** the parent does NOT receive karma for the action.

### Requirement: Authorization
The API MUST enforce that only the assignee or a parent can complete a member-targeted task.
#### Scenario: Reject non-parent completing another member's task
- **GIVEN** a child user attempts to complete a task whose `assignment.memberId` is a different user
- **WHEN** they call the PATCH endpoint with `completedAt`
- **THEN** the API responds with HTTP 403 and an error explaining only parents can complete tasks for someone else.

#### Scenario: Allow parents to complete any member-assigned task
- **GIVEN** an authenticated parent user
- **WHEN** they complete a task assigned to another user in the same family
- **THEN** the PATCH succeeds (assuming other validations pass).

### Requirement: Activity Event Recording on Task Completion
Recorded events MUST reflect both the credited user and, when different, the actor who clicked complete.
#### Scenario: Record credited user and actor metadata
- **WHEN** a task completion activity event is recorded
- **THEN** `userId` MUST represent the member credited with completion (the assignee for member tasks)
- **AND** if the actor differs from the credited member, the event metadata MUST include `triggeredBy` with the actor's user ID so history shows who marked it complete.

### Requirement: Real-time Task Event Emission
`task.completed` events MUST surface both the credited member and the actor so clients can display accurate context.
#### Scenario: Include actor for task.completed events
- **WHEN** emitting a `task.completed` event
- **THEN** the payload MUST continue to expose `completedBy` as the credited member ID
- **AND** it MUST include a `triggeredBy` field with the user ID that performed the action when they differ
- **AND** clients MUST be able to rely on this field when showing "marked complete by" context.
