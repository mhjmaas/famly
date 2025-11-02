# rewards Specification

## Purpose
TBD - created by archiving change add-karma-rewards. Update Purpose after archive.
## Requirements
### Requirement: Reward Creation
Parents MUST be able to create family-specific rewards with a name, karma cost, optional description, and optional image URL.

#### Scenario: Create reward successfully
- **GIVEN** an authenticated parent in a family
- **WHEN** they POST to `/v1/families/{familyId}/rewards` with `{ name: "Extra screen time", karmaCost: 50, description: "30 minutes extra", imageUrl: "https://example.com/icon.png" }`
- **THEN** the API responds with HTTP 201 and returns the created reward
- **AND** the response includes `id`, `familyId`, `name`, `karmaCost`, `description`, `imageUrl`, `createdBy`, `createdAt`, and `updatedAt`

#### Scenario: Create reward with minimal fields
- **GIVEN** an authenticated parent
- **WHEN** they POST with only `{ name: "Ice cream", karmaCost: 25 }`
- **THEN** the reward is created successfully without description or imageUrl

#### Scenario: Reject reward with missing name
- **GIVEN** an authenticated parent
- **WHEN** they POST without a `name` field
- **THEN** the API responds with HTTP 400 indicating name is required

#### Scenario: Reject reward with missing karma cost
- **GIVEN** an authenticated parent
- **WHEN** they POST without a `karmaCost` field
- **THEN** the API responds with HTTP 400 indicating karmaCost is required

#### Scenario: Reject reward with invalid karma cost
- **GIVEN** an authenticated parent
- **WHEN** they POST with `karmaCost: 0` or `karmaCost: -10` or `karmaCost: 1500`
- **THEN** the API responds with HTTP 400 indicating karmaCost must be between 1 and 1000

#### Scenario: Reject reward with non-integer karma cost
- **GIVEN** an authenticated parent
- **WHEN** they POST with `karmaCost: 10.5`
- **THEN** the API responds with HTTP 400 indicating karmaCost must be an integer

#### Scenario: Reject reward with overly long name
- **GIVEN** an authenticated parent
- **WHEN** they POST with name exceeding 100 characters
- **THEN** the API responds with HTTP 400 indicating max name length is 100

#### Scenario: Reject reward with overly long description
- **GIVEN** an authenticated parent
- **WHEN** they POST with description exceeding 500 characters
- **THEN** the API responds with HTTP 400 indicating max description length is 500

#### Scenario: Reject reward with invalid image URL
- **GIVEN** an authenticated parent
- **WHEN** they POST with `imageUrl: "not-a-url"`
- **THEN** the API responds with HTTP 400 indicating imageUrl must be a valid HTTP(S) URL

#### Scenario: Reject reward with overly long image URL
- **GIVEN** an authenticated parent
- **WHEN** they POST with imageUrl exceeding 500 characters
- **THEN** the API responds with HTTP 400 indicating max imageUrl length is 500

#### Scenario: Require parent role for creation
- **GIVEN** an authenticated child member of a family
- **WHEN** they attempt to POST to create a reward
- **THEN** the API responds with HTTP 403 Forbidden indicating parent role required

#### Scenario: Require family membership
- **GIVEN** an authenticated parent who is NOT a member of the specified family
- **WHEN** they attempt to create a reward for that family
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Reward Listing
Family members MUST be able to list all rewards available in their family.

#### Scenario: List all family rewards
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/rewards`
- **THEN** the API responds with HTTP 200 and an array of all rewards for the family
- **AND** each reward includes full reward details plus metadata (claim count, favourite status for requesting user)

#### Scenario: Empty list for family with no rewards
- **GIVEN** an authenticated family member in a family with no rewards
- **WHEN** they GET rewards
- **THEN** the API responds with HTTP 200 and an empty array

#### Scenario: Rewards sorted by creation date
- **GIVEN** multiple rewards in a family
- **WHEN** a member lists rewards
- **THEN** rewards are sorted by `createdAt` in descending order (newest first)

#### Scenario: Require family membership for listing
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to list rewards for that family
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Reward Retrieval
Family members MUST be able to retrieve detailed information about a specific reward.

#### Scenario: Get reward by ID
- **GIVEN** an authenticated family member
- **WHEN** they GET `/v1/families/{familyId}/rewards/{rewardId}`
- **THEN** the API responds with HTTP 200 and the complete reward object
- **AND** the response includes metadata such as total claim count and favourite count

#### Scenario: Reward not found
- **GIVEN** an authenticated family member
- **WHEN** they GET a non-existent reward ID
- **THEN** the API responds with HTTP 404 Not Found

#### Scenario: Access denied for wrong family
- **GIVEN** an authenticated user who is a member of familyA but not familyB
- **WHEN** they GET a reward belonging to familyB
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Reward Update
Parents MUST be able to update reward details including name, karma cost, description, and image URL.

#### Scenario: Update reward name and cost
- **GIVEN** an authenticated parent
- **WHEN** they PATCH `/v1/families/{familyId}/rewards/{rewardId}` with `{ name: "Updated Name", karmaCost: 75 }`
- **THEN** the API responds with HTTP 200 and the updated reward
- **AND** `updatedAt` timestamp is refreshed

#### Scenario: Update reward description
- **GIVEN** an authenticated parent
- **WHEN** they PATCH with `{ description: "Updated description" }`
- **THEN** only the description is updated

#### Scenario: Clear optional fields
- **GIVEN** an authenticated parent with a reward that has description and imageUrl
- **WHEN** they PATCH with `{ description: null, imageUrl: null }`
- **THEN** both fields are cleared

#### Scenario: Validate updated karma cost
- **GIVEN** an authenticated parent
- **WHEN** they PATCH with invalid karmaCost (e.g., 0, -5, 2000)
- **THEN** the API responds with HTTP 400 with validation error

#### Scenario: Require parent role for update
- **GIVEN** an authenticated child member
- **WHEN** they attempt to PATCH a reward
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Updating reward does not affect pending claims
- **GIVEN** a reward with pending claims
- **WHEN** a parent updates the reward's karmaCost
- **THEN** existing pending claims retain the original karmaCost
- **AND** new claims use the updated karmaCost

### Requirement: Reward Deletion
Parents MUST be able to delete rewards from their family.

#### Scenario: Delete reward successfully
- **GIVEN** an authenticated parent
- **WHEN** they DELETE `/v1/families/{familyId}/rewards/{rewardId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the reward is removed from the database

#### Scenario: Prevent deletion of reward with pending claims
- **GIVEN** a reward with one or more pending claims
- **WHEN** a parent attempts to DELETE the reward
- **THEN** the API responds with HTTP 409 Conflict indicating pending claims must be resolved first

#### Scenario: Allow deletion of reward with only completed/cancelled claims
- **GIVEN** a reward with completed or cancelled claims (no pending)
- **WHEN** a parent deletes the reward
- **THEN** the deletion succeeds
- **AND** historical claims remain in database (soft reference)

#### Scenario: Require parent role for deletion
- **GIVEN** an authenticated child member
- **WHEN** they attempt to DELETE a reward
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Reward Claiming
Family members MUST be able to claim rewards if they have sufficient karma, triggering a parent approval workflow.

#### Scenario: Claim reward successfully
- **GIVEN** an authenticated family member with karma >= reward's karmaCost
- **WHEN** they POST to `/v1/families/{familyId}/rewards/{rewardId}/claim`
- **THEN** the API responds with HTTP 201 and returns the created claim
- **AND** the claim has `status: 'pending'`
- **AND** an auto-task is created with assignment `{ type: 'role', role: 'parent' }`
- **AND** the task name is "Provide reward: {rewardName} for {memberName}"
- **AND** the task description is "This will deduct {karmaCost} karma from {memberName}"
- **AND** the task metadata includes `claimId` reference
- **AND** the claim includes `autoTaskId` reference

#### Scenario: Reject claim with insufficient karma
- **GIVEN** an authenticated family member with karma < reward's karmaCost
- **WHEN** they attempt to claim the reward
- **THEN** the API responds with HTTP 400 indicating insufficient karma
- **AND** no claim or task is created

#### Scenario: Prevent duplicate pending claims
- **GIVEN** a member with a pending claim for rewardA
- **WHEN** they attempt to claim rewardA again
- **THEN** the API responds with HTTP 409 Conflict indicating a pending claim already exists

#### Scenario: Allow multiple pending claims for different rewards
- **GIVEN** a member with a pending claim for rewardA
- **WHEN** they claim rewardB
- **THEN** the claim succeeds and a second pending claim is created

#### Scenario: Require family membership for claiming
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to claim a reward from that family
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Claim Listing
Family members MUST be able to list their own reward claims with optional status filtering.

#### Scenario: List own claims
- **GIVEN** an authenticated family member with multiple claims
- **WHEN** they GET `/v1/families/{familyId}/claims`
- **THEN** the API responds with HTTP 200 and an array of their claims
- **AND** each claim includes full details: reward info, status, timestamps, autoTaskId

#### Scenario: Filter claims by status
- **GIVEN** an authenticated family member with claims in various states
- **WHEN** they GET `/v1/families/{familyId}/claims?status=pending`
- **THEN** only claims with `status: 'pending'` are returned

#### Scenario: Parents can list all family claims
- **GIVEN** an authenticated parent in a family
- **WHEN** they GET `/v1/families/{familyId}/claims?allMembers=true`
- **THEN** the API returns claims from all family members

#### Scenario: Children can only see own claims
- **GIVEN** an authenticated child member
- **WHEN** they GET claims with `allMembers=true` parameter
- **THEN** the API ignores the parameter and returns only their own claims

#### Scenario: Claims sorted by creation date
- **GIVEN** multiple claims
- **WHEN** listing claims
- **THEN** claims are sorted by `createdAt` in descending order (newest first)

### Requirement: Claim Cancellation
Members and parents MUST be able to cancel pending claims, removing the auto-task and reverting claim status.

#### Scenario: Member cancels own pending claim
- **GIVEN** an authenticated member with a pending claim
- **WHEN** they DELETE `/v1/families/{familyId}/claims/{claimId}`
- **THEN** the API responds with HTTP 204 No Content
- **AND** the claim status is updated to `cancelled`
- **AND** `cancelledBy` is set to the member's userId
- **AND** `cancelledAt` timestamp is set
- **AND** the auto-task is deleted from the tasks collection

#### Scenario: Parent cancels member's pending claim
- **GIVEN** an authenticated parent in a family
- **WHEN** they DELETE a pending claim created by a child member
- **THEN** the cancellation succeeds
- **AND** `cancelledBy` is set to the parent's userId

#### Scenario: Cannot cancel completed claim
- **GIVEN** a claim with `status: 'completed'`
- **WHEN** attempting to DELETE it
- **THEN** the API responds with HTTP 400 indicating claim is already completed

#### Scenario: Cannot cancel already cancelled claim
- **GIVEN** a claim with `status: 'cancelled'`
- **WHEN** attempting to DELETE it
- **THEN** the API responds with HTTP 400 indicating claim is already cancelled

#### Scenario: Require family membership for cancellation
- **GIVEN** an authenticated user who is NOT a member of the specified family
- **WHEN** they attempt to cancel a claim from that family
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Child cannot cancel another child's claim
- **GIVEN** an authenticated child member
- **WHEN** they attempt to cancel a claim belonging to another child
- **THEN** the API responds with HTTP 403 Forbidden

### Requirement: Claim Completion via Task
When a parent completes the auto-generated task, the system MUST mark the claim as completed and deduct karma from the member.

#### Scenario: Complete claim via task completion
- **GIVEN** a pending claim with an auto-task
- **WHEN** a parent marks the task as completed (PATCH task with `completedAt`)
- **THEN** the claim status is updated to `completed`
- **AND** `completedBy` is set to the parent's userId
- **AND** `completedAt` timestamp is set
- **AND** karma is deducted from the member: `totalKarma -= reward.karmaCost`
- **AND** a karma event is created with `source: 'reward_redemption'`, description including reward name, and metadata with `claimId`
- **AND** the reward metadata for this member is updated: `claimCount` incremented

#### Scenario: Prevent negative karma balance
- **GIVEN** a pending claim where member's karma dropped below karmaCost since claiming
- **WHEN** a parent completes the auto-task
- **THEN** the API responds with HTTP 400 indicating insufficient karma
- **AND** the claim remains pending
- **AND** the task remains incomplete

#### Scenario: Task completion succeeds even if metadata update fails
- **GIVEN** a pending claim with auto-task
- **WHEN** the task is completed and karma is deducted successfully
- **AND** the metadata service fails to increment claimCount
- **THEN** the claim still completes and karma is still deducted
- **AND** the metadata failure is logged but does not rollback the operation

#### Scenario: Manual task deletion does not affect claim
- **GIVEN** a pending claim with an auto-task
- **WHEN** the auto-task is manually deleted via task deletion endpoint
- **THEN** the claim remains in `pending` status
- **AND** the claim can still be cancelled via claim cancellation endpoint

### Requirement: Favourite Rewards
Family members MUST be able to mark rewards as favourites for personal tracking.

#### Scenario: Toggle favourite on
- **GIVEN** an authenticated family member
- **WHEN** they POST to `/v1/families/{familyId}/rewards/{rewardId}/favourite` with `{ isFavourite: true }`
- **THEN** the API responds with HTTP 200
- **AND** the member's metadata for this reward is updated with `isFavourite: true`

#### Scenario: Toggle favourite off
- **GIVEN** a member with a reward marked as favourite
- **WHEN** they POST with `{ isFavourite: false }`
- **THEN** the favourite flag is set to false

#### Scenario: Favourite status is member-specific
- **GIVEN** memberA marks rewardX as favourite
- **WHEN** memberB retrieves rewardX
- **THEN** memberB sees `isFavourite: false` (their own status)

#### Scenario: Favourite toggling is idempotent
- **GIVEN** a reward already marked as favourite
- **WHEN** toggling favourite on again
- **THEN** the operation succeeds without error

#### Scenario: List only favourite rewards
- **GIVEN** a member with some rewards marked as favourite
- **WHEN** they GET `/v1/families/{familyId}/rewards?favouritesOnly=true`
- **THEN** only rewards with `isFavourite: true` for this member are returned

### Requirement: Reward Metadata Tracking
The system MUST track per-member metadata including claim count and favourite status for each reward.

#### Scenario: Increment claim count on completion
- **GIVEN** a member completes a claim for rewardA (parent completes task)
- **THEN** the member's metadata for rewardA has `claimCount` incremented by 1

#### Scenario: Claim count persists after reward updates
- **GIVEN** a member has claimed rewardA 3 times
- **WHEN** a parent updates rewardA's name or karmaCost
- **THEN** the member's `claimCount` for rewardA remains 3

#### Scenario: Claim count not affected by cancellations
- **GIVEN** a member cancels a pending claim
- **THEN** their `claimCount` for that reward remains unchanged

#### Scenario: Initial metadata state
- **GIVEN** a member who has never interacted with rewardA
- **WHEN** they retrieve rewardA
- **THEN** the response shows `claimCount: 0` and `isFavourite: false`

### Requirement: Authorization
All reward and claim operations MUST enforce family membership and role-based access control.

#### Scenario: Require authentication for all endpoints
- **GIVEN** an unauthenticated request (no JWT token)
- **WHEN** accessing any reward or claim endpoint
- **THEN** the API responds with HTTP 401 Unauthorized

#### Scenario: Parent role required for reward management
- **GIVEN** an authenticated child member
- **WHEN** attempting to create, update, or delete a reward
- **THEN** the API responds with HTTP 403 Forbidden

#### Scenario: Any member can claim and view rewards
- **GIVEN** an authenticated child member
- **WHEN** they list, retrieve, or claim rewards
- **THEN** the operations succeed

#### Scenario: Members can only cancel own claims (unless parent)
- **GIVEN** an authenticated child member
- **WHEN** they attempt to cancel another member's claim
- **THEN** the API responds with HTTP 403 Forbidden
- **AND** when a parent attempts the same operation, it succeeds

### Requirement: Field Validation
The system MUST enforce field length, type, and format constraints for all reward and claim operations.

#### Scenario: Validate reward name length
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with name exceeding 100 characters
- **THEN** the API responds with HTTP 400 indicating max name length is 100

#### Scenario: Validate reward description length
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with description exceeding 500 characters
- **THEN** the API responds with HTTP 400 indicating max description length is 500

#### Scenario: Validate karma cost range
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with karmaCost < 1 or > 1000
- **THEN** the API responds with HTTP 400 indicating karmaCost must be between 1 and 1000

#### Scenario: Validate karma cost type
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with karmaCost as non-integer
- **THEN** the API responds with HTTP 400 indicating karmaCost must be an integer

#### Scenario: Validate image URL format
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with invalid imageUrl
- **THEN** the API responds with HTTP 400 indicating imageUrl must be a valid HTTP(S) URL

#### Scenario: Validate image URL length
- **GIVEN** an authenticated parent
- **WHEN** they create or update a reward with imageUrl exceeding 500 characters
- **THEN** the API responds with HTTP 400 indicating max imageUrl length is 500

