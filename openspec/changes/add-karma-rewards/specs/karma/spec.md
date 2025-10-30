# Karma Specification Delta

## MODIFIED Requirements

### Requirement: Karma Event Metadata
All karma events MUST include source information and optional metadata for audit purposes.

#### Scenario: Reward redemption event includes claim reference
- **GIVEN** a reward claim completion that deducts karma
- **THEN** the created karma event has `source: 'reward_redemption'`
- **AND** the event metadata includes `claimId` referencing the completed claim
- **AND** the event description includes the reward name

## ADDED Requirements

### Requirement: Karma Deduction for Reward Redemptions
The system MUST support deducting karma from members when rewards are redeemed, with validation to prevent negative balances.

#### Scenario: Deduct karma on reward claim completion
- **GIVEN** a member with `totalKarma: 100` completes a reward claim costing 50 karma
- **WHEN** the system processes the claim completion
- **THEN** a karma event is created with `amount: -50`, `source: 'reward_redemption'`, and description including reward name
- **AND** the member's `totalKarma` is decremented to 50
- **AND** the event metadata includes `claimId`

#### Scenario: Prevent deduction causing negative balance
- **GIVEN** a member with `totalKarma: 30`
- **WHEN** attempting to deduct 50 karma for a reward claim
- **THEN** the operation fails with validation error indicating insufficient karma
- **AND** no karma event is created
- **AND** the member's `totalKarma` remains unchanged at 30

#### Scenario: Deduction updates updatedAt timestamp
- **GIVEN** a member with sufficient karma
- **WHEN** karma is deducted for a reward claim
- **THEN** the member's `updatedAt` timestamp in the `member_karma` collection is refreshed

#### Scenario: Atomic deduction with event creation
- **GIVEN** a karma deduction operation
- **WHEN** creating the karma event and updating the total
- **THEN** both operations succeed atomically (using $inc operator)
- **AND** if either fails, neither change is persisted

#### Scenario: Deduction event in karma history
- **GIVEN** a member who has had karma deducted for a reward
- **WHEN** they GET their karma history
- **THEN** the deduction event appears with negative amount in the history
- **AND** events are still sorted by `createdAt` descending

#### Scenario: Balance calculation includes deductions
- **GIVEN** a member with karma events: +100, +50, -30, -20
- **WHEN** calculating their total karma
- **THEN** the sum is 100 (100 + 50 - 30 - 20)
- **AND** this matches their `totalKarma` in the `member_karma` collection

### Requirement: Karma Source Extension
The karma system MUST support 'reward_redemption' as a valid karma event source alongside existing sources.

#### Scenario: Accept reward_redemption source
- **GIVEN** a karma deduction operation with `source: 'reward_redemption'`
- **WHEN** creating the karma event
- **THEN** the event is created successfully with the reward_redemption source

#### Scenario: Validate karma source enum
- **GIVEN** an attempt to create a karma event with invalid source
- **WHEN** the source is not one of 'task_completion', 'manual_grant', 'reward_redemption'
- **THEN** validation fails with error indicating invalid source

### Requirement: Data Consistency Between Totals and Events with Deductions
The system MUST maintain consistency between the aggregate karma total and the sum of karma events, accounting for both additions and deductions.

#### Scenario: Karma total matches event sum with deductions
- **GIVEN** a member with karma events including both additions and deductions
- **WHEN** summing all event amounts (positive and negative) for that member in that family
- **THEN** the sum MUST equal the member's `totalKarma` in the `member_karma` collection

#### Scenario: Negative event amounts are stored as negative
- **GIVEN** a reward redemption deducting 50 karma
- **THEN** the karma event is stored with `amount: -50` (not as positive 50 with special flag)
- **AND** the event description clearly indicates deduction

## MODIFIED Requirements

### Requirement: Field Validation
The system MUST enforce field constraints and formats for all karma operations, including deductions.

#### Scenario: Validate deduction amount is negative
- **GIVEN** a karma deduction operation
- **WHEN** the amount provided is positive (e.g., 50 instead of -50)
- **THEN** the system automatically treats it as negative or validation fails with clear error

#### Scenario: Validate deduction does not exceed balance
- **GIVEN** a member with `totalKarma: 100`
- **WHEN** attempting to deduct 150 karma
- **THEN** the API responds with HTTP 400 indicating insufficient karma (cannot create negative balance)
