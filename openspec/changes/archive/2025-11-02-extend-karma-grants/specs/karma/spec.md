# karma Specification - Extend Karma Grants

## ADDED Requirements

### Requirement: Manual Karma Deductions via Grant Endpoint
Parents MUST be able to manually deduct karma (negative amounts) from family members via the grant endpoint for penalties or corrections.

#### Scenario: Deduct karma successfully (negative grant)
- **GIVEN** an authenticated parent in a family
- **WHEN** they POST to `/v1/families/{familyId}/karma/grant` with `{ userId, amount: -50, description: "Penalty" }`
- **THEN** the API responds with HTTP 201 and returns the created karma event
- **AND** the response includes `amount: -50` and `newTotal` reflecting the deduction
- **AND** a karma event is created with `source: 'manual_grant'` and `amount: -50`
- **AND** the member's karma total is decremented by 50 (moved toward negative)
- **AND** the event metadata includes `grantedBy` with the parent's user ID

#### Scenario: Grant negative amount without description
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `{ userId, amount: -25 }` (no description)
- **THEN** the karma deduction succeeds with an empty or default description

#### Scenario: Deduct maximum allowed amount
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: -100000` (maximum negative)
- **THEN** the API responds with HTTP 201 and the deduction succeeds

#### Scenario: Reject amount below minimum
- **GIVEN** an authenticated parent
- **WHEN** they POST to grant karma with `amount: -100001` (exceeds minimum)
- **THEN** the API responds with HTTP 400 indicating amount cannot be less than -100,000

#### Scenario: Allow negative karma totals
- **GIVEN** a member with 0 karma balance
- **WHEN** a parent grants -50 karma
- **THEN** the member's total karma becomes -50
- **AND** the negative total is persisted and retrievable

#### Scenario: Negative amount appears in history
- **GIVEN** a member who received a -30 karma penalty
- **WHEN** they GET karma history
- **THEN** the event appears with `amount: -30` and negative amount is recorded
