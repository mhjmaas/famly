## ADDED Requirements
### Requirement: Recurring Contribution Goals
Recurring contribution goals SHALL recreate automatically for the next week when enabled.

#### Scenario: Parent creates recurring contribution goal
- **WHEN** a parent creates a contribution goal with `recurring` set to true
- **THEN** the goal is stored with recurring=true for the current week

#### Scenario: Recurring defaults to false
- **WHEN** a parent creates a contribution goal without specifying `recurring`
- **THEN** recurring defaults to false

#### Scenario: Recreate recurring goal for next week
- **WHEN** the weekly cron job processes contribution goals at Sunday 18:00 UTC
- **AND** a processed goal has recurring=true
- **THEN** the system creates a new contribution goal for the next week with the same title, description, maxKarma, and recurring=true
- **AND** the new goal starts at the next week's weekStartDate (current week start + 7 days)
- **AND** the new goal has an empty deductions array

#### Scenario: Non-recurring goals are not recreated
- **WHEN** the weekly cron job processes contribution goals at Sunday 18:00 UTC
- **AND** a processed goal has recurring=false
- **THEN** no new contribution goal is created for the next week
