## MODIFIED Requirements

### Requirement: Task Completion
The tasks UI MUST enforce the new completion guardrails and show feedback that clarifies who earned the reward.
#### Scenario: Disable completion toggle for other members unless viewer is parent
- **GIVEN** the tasks list renders a task assigned to a different specific member than the current user
- **WHEN** the viewer has the child role
- **THEN** the completion checkbox MUST be disabled, show a tooltip explaining "Only parents can complete tasks for other members", and no PATCH request is fired when it is clicked.

#### Scenario: Allow parents to complete other members' tasks with clear feedback
- **GIVEN** a parent views a task assigned to Child A
- **WHEN** they click the checkbox
- **THEN** the UI MUST optimistically show the task as completed, dispatch the completion thunk using Child A's user ID for karma credit, and display a toast such as "Marked done for Child A. They earned {karma} karma points" (or the non-karma variant when applicable).

#### Scenario: Karma balance updates for the credited member
- **GIVEN** the sidebar karma summary is visible for multiple members
- **WHEN** a parent completes Child A's task with 15 karma
- **THEN** the Redux karma selector MUST show Child A's total increasing by 15 while the parent's total stays unchanged, and the sidebar reflects the new value without a full reload.
