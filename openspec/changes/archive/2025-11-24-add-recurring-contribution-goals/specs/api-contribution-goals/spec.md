## ADDED Requirements
### Requirement: API supports recurring contribution goals
The contribution goals API SHALL accept and return a `recurring` boolean field.

#### Scenario: Create contribution goal accepts recurring flag
- **WHEN** POST `/families/:familyId/contribution-goals` is called with recurring provided
- **THEN** the API validates recurring as boolean (default false when omitted)
- **AND** stores the flag on the created goal
- **AND** returns recurring in the response DTO

#### Scenario: Update contribution goal can change recurring flag
- **WHEN** PUT `/families/:familyId/contribution-goals/:memberId` is called with recurring provided
- **THEN** the API updates the recurring flag for the current week's goal
- **AND** returns the updated recurring value in the response DTO

#### Scenario: Goal retrieval includes recurring flag
- **WHEN** GET `/families/:familyId/contribution-goals/:memberId` is called
- **THEN** the response DTO includes recurring for the current week's goal
