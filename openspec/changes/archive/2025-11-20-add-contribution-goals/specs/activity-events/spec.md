# Activity Events Specification Changes

## ADDED Requirements

### Requirement: Contribution Goal Activity Event Type
The activity events system SHALL support CONTRIBUTION_GOAL event type for tracking goal-related activities.

#### Scenario: Record contribution goal deduction event
- **WHEN** a deduction is added to a contribution goal
- **THEN** create activity event with type="CONTRIBUTION_GOAL" and detail="DEDUCTED"
- **AND** include metadata { karma: -amount, triggeredBy: parentUserId }
- **AND** set title to "Karma deducted from contribution goal"
- **AND** set description to the deduction reason

#### Scenario: Record contribution goal award event
- **WHEN** weekly karma is awarded from a contribution goal
- **THEN** create activity event with type="CONTRIBUTION_GOAL" and detail="AWARDED"
- **AND** include metadata { karma: awardedAmount, goalId: string }
- **AND** set title to "Weekly contribution goal completed"
- **AND** set description to goal title and summary

#### Scenario: Activity events are queryable by type and detail
- **WHEN** fetching activity events for a member
- **THEN** CONTRIBUTION_GOAL events appear in chronological order
- **AND** can be filtered by date range to show only current week's deductions
