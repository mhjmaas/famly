# Realtime Events Specification Changes

## ADDED Requirements

### Requirement: Contribution Goal Real-time Events
The real-time event system SHALL emit events for contribution goal changes to notify connected clients.

#### Scenario: Emit contribution goal deducted event
- **WHEN** a deduction is added to a contribution goal
- **THEN** emit event with type "contribution_goal:deducted"
- **AND** include payload { familyId, memberId, goalId, deduction: { amount, reason, deductedBy }, currentKarma }
- **AND** broadcast to all family members' connections

#### Scenario: Emit contribution goal awarded event
- **WHEN** weekly karma is awarded from a contribution goal
- **THEN** emit event with type "contribution_goal:awarded"
- **AND** include payload { familyId, memberId, karmaAwarded, goalTitle }
- **AND** broadcast to all family members' connections

#### Scenario: Emit contribution goal updated event
- **WHEN** a contribution goal is created, updated, or deleted
- **THEN** emit event with type "contribution_goal:updated"
- **AND** include payload { familyId, memberId, action: "created" | "updated" | "deleted" }
- **AND** broadcast to all family members' connections
