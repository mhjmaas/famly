## MODIFIED Requirements

### Requirement: Pending Tasks Section
The dashboard pending tasks UI MUST follow the same completion permissions and messaging as the dedicated tasks page.
#### Scenario: Restrict completion of other members' tasks to parents
- **GIVEN** the dashboard shows a pending task assigned to another member
- **WHEN** the current user is a child
- **THEN** the checkbox control MUST be disabled with helper text indicating only parents may mark it done, and no completion request is triggered.

#### Scenario: Parent completes another member's task with accurate messaging
- **GIVEN** a parent user sees Child A's pending task in the dashboard list
- **WHEN** they toggle the checkbox
- **THEN** the dashboard MUST use the same completion helper as the tasks page, credit Child A's karma balance, and show toast copy that explicitly mentions Child A earned the reward.
