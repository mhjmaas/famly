## MODIFIED Requirements

### Requirement: Automatic Karma Awards from Task Completion
Automatic awards MUST always target the member who owns the task, even when another user triggers the completion.
#### Scenario: Award karma to the assignment owner
- **GIVEN** a task with `metadata.karma: 15` assigned to Member A
- **AND** a parent user marks the task complete on their behalf
- **WHEN** the system processes the completion
- **THEN** the created karma event MUST credit Member A (amount +15, `userId` Member A)
- **AND** the parent who toggled completion MUST NOT receive karma.

#### Scenario: Deduct karma from the original assignee when reopening
- **GIVEN** a task previously completed on behalf of another member (credited to Member A)
- **WHEN** anyone reopens the task (`completedAt: null`)
- **THEN** the reversal event MUST deduct karma from Member A regardless of who triggered the reopen.
