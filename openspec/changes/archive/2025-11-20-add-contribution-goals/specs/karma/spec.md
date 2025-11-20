# Karma Specification Changes

## ADDED Requirements

### Requirement: Contribution Goal Karma Source
The karma service SHALL support a new source type for contribution goal weekly awards.

#### Scenario: Award karma from contribution goal
- **WHEN** karma is awarded with source "contribution_goal_weekly"
- **THEN** the karma event is created with appropriate metadata including goalId and weekStartDate
- **AND** the karma is added to the member's total
- **AND** an activity event is NOT created (handled by contribution goals module)

#### Scenario: Karma event includes contribution goal metadata
- **WHEN** contribution goal awards karma at week end
- **THEN** the karma event metadata includes { goalId: string, weekStartDate: ISO date, originalMaxKarma: number, totalDeductions: number }
- **AND** this metadata enables future reporting or auditing of contribution goals
