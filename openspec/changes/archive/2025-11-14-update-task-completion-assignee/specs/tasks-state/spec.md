## MODIFIED Requirements

### Requirement: Integration with Karma Slice
Redux orchestration MUST keep karma deltas aligned with the member credited for each task completion.
#### Scenario: Increment karma for assignment owner when parent completes
- **GIVEN** Redux receives a fulfilled `completeTask` action for a task with karma that is assigned to Child A
- **AND** the action payload originated from a parent user
- **THEN** the completion thunk MUST dispatch `incrementKarma({ userId: Child A, amount })`
- **AND** the karma slice MUST update Child A's balance, not the parent’s.

#### Scenario: Decrement karma for the originally credited member when reopening
- **GIVEN** a task credited to Child A is reopened by anyone
- **WHEN** `reopenTask` resolves
- **THEN** the thunk MUST dispatch `decrementKarma({ userId: Child A, amount })` so balances stay accurate.
