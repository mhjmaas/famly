## ADDED Requirements
### Requirement: Recurring toggle in contribution goal dialogs
The web UI SHALL let parents set contribution goals as recurring when creating or editing.

#### Scenario: Create dialog shows recurring switch
- **WHEN** the create contribution goal dialog is opened by a parent
- **THEN** it shows a toggle labeled for recurring weekly goals
- **AND** the toggle defaults to off
- **AND** submitting sends the recurring value to the API

#### Scenario: Edit dialog reflects and updates recurring flag
- **WHEN** a parent opens the edit contribution goal dialog for an existing goal
- **THEN** the recurring toggle reflects the current recurring value
- **AND** the parent can change it and save
- **AND** the change is sent to the API and updates state

#### Scenario: Recurring flag stored in client state
- **WHEN** contribution goals are fetched
- **THEN** the Redux slice stores recurring per goal
- **AND** UI components use it to render and submit forms
