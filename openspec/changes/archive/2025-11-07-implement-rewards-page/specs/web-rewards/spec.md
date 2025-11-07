# web-rewards Specification Delta

## ADDED Requirements

### Requirement: Rewards Page Display
The web application MUST display a rewards page showing all family rewards with metadata, karma balance, and claim status.

#### Scenario: Load rewards page with rewards
- **GIVEN** an authenticated family member accessing `/app/rewards`
- **WHEN** the page loads
- **THEN** the page displays the user's current karma balance
- **AND** displays all rewards for the family in a grid layout
- **AND** each reward shows name, description, image, karma cost, and claim count
- **AND** each reward shows the user's favourite status
- **AND** each reward shows pending claim status if user has pending claim
- **AND** favourited rewards display a progress bar showing karma savings progress

#### Scenario: Load rewards page with no rewards
- **GIVEN** an authenticated family member in a family with no rewards
- **WHEN** the page loads
- **THEN** an empty state card is displayed
- **AND** if user is a parent, a "Create Reward" button is shown
- **AND** if user is a child, message says "Ask a parent to add rewards"

#### Scenario: Reward grid responsive layout
- **GIVEN** rewards are displayed
- **WHEN** the viewport changes size
- **THEN** rewards display in 1 column on mobile (< 768px)
- **AND** rewards display in 2 columns on tablet (768px - 1024px)
- **AND** rewards display in 3 columns on desktop (>= 1024px)

#### Scenario: Karma balance display
- **GIVEN** the rewards page is loaded
- **WHEN** displaying the karma balance card
- **THEN** it shows the current user's total karma
- **AND** uses a Sparkles icon with primary color fill
- **AND** displays "Your Available Karma" label
- **AND** shows the karma amount prominently

### Requirement: Reward Favouriting
Family members MUST be able to mark rewards as favourites and track their savings progress toward favourite rewards.

#### Scenario: Toggle reward as favourite
- **GIVEN** an authenticated family member viewing a reward
- **WHEN** they click the heart icon on the reward card
- **THEN** the reward is marked as favourite
- **AND** the heart icon fills with red color
- **AND** a progress bar appears showing karma savings progress
- **AND** the API endpoint `/v1/families/{familyId}/rewards/{rewardId}/favourite` is called with `{ isFavourite: true }`

#### Scenario: Remove reward from favourites
- **GIVEN** a reward is marked as favourite
- **WHEN** the user clicks the filled heart icon
- **THEN** the favourite status is removed
- **AND** the heart icon becomes unfilled
- **AND** the progress bar is hidden
- **AND** the API is called with `{ isFavourite: false }`

#### Scenario: Progress bar calculation
- **GIVEN** a reward is favourited with karma cost of 100
- **AND** the user has 75 karma
- **WHEN** displaying the progress bar
- **THEN** the progress bar shows 75% filled
- **AND** displays "75 / 100" text
- **AND** displays "25 more karma needed" message

#### Scenario: Progress bar at 100%
- **GIVEN** a favourited reward with karma cost of 50
- **AND** the user has 75 karma
- **WHEN** displaying the progress bar
- **THEN** the progress bar shows 100% filled (capped at 100%)
- **AND** displays "75 / 50" text
- **AND** displays "You have enough karma!" message in green

#### Scenario: Favourite status persists across sessions
- **GIVEN** a user has favourited rewardA
- **WHEN** they reload the page or sign in from another device
- **THEN** rewardA still shows as favourited with progress bar

### Requirement: Reward Claiming
Family members MUST be able to claim rewards when they have sufficient karma, triggering a confirmation workflow and pending status.

#### Scenario: Claim reward with sufficient karma
- **GIVEN** a family member with 100 karma viewing a reward costing 50 karma
- **WHEN** they click the "Claim" button
- **THEN** a confirmation sheet opens
- **AND** the sheet displays the reward details (image, name, description, karma cost)
- **AND** the sheet explains what happens next (4 steps)
- **WHEN** the user clicks "Confirm Claim"
- **THEN** the API endpoint POST `/v1/families/{familyId}/rewards/{rewardId}/claim` is called
- **AND** a claim is created with status "pending"
- **AND** the reward card updates to show "Pending" button (disabled)
- **AND** the confirmation sheet closes

#### Scenario: Claim button disabled with insufficient karma
- **GIVEN** a family member with 30 karma viewing a reward costing 50 karma
- **WHEN** viewing the reward card
- **THEN** the claim button is disabled
- **AND** the button text shows "Not enough karma"

#### Scenario: Cannot claim reward with pending claim
- **GIVEN** a family member with a pending claim for rewardA
- **WHEN** viewing rewardA card
- **THEN** the button shows "Pending" and is disabled
- **AND** the claim button is not clickable

#### Scenario: Cancel claim confirmation sheet
- **GIVEN** the claim confirmation sheet is open
- **WHEN** the user clicks "Cancel"
- **THEN** the sheet closes
- **AND** no claim is created
- **AND** the reward card remains in claimable state

### Requirement: Pending Claim Management
Family members MUST be able to view and cancel their pending claims while parents can cancel any pending claim.

#### Scenario: Cancel own pending claim
- **GIVEN** a family member with a pending claim for rewardA
- **WHEN** they open the reward card dropdown menu
- **AND** click "Cancel Claim"
- **THEN** the API endpoint DELETE `/v1/families/{familyId}/claims/{claimId}` is called
- **AND** the claim status updates to "cancelled"
- **AND** the reward card claim button shows "Claim" and is enabled again

#### Scenario: Parent cancels member's pending claim
- **GIVEN** a parent viewing a reward with another member's pending claim
- **WHEN** they open the reward card dropdown
- **AND** click "Cancel Claim"
- **THEN** the claim is cancelled
- **AND** the reward card updates for that member

#### Scenario: Pending claim indicator on reward card
- **GIVEN** a reward with a user's pending claim
- **WHEN** viewing the reward card
- **THEN** the claim button shows "Pending" text
- **AND** displays a Clock icon
- **AND** the button is disabled

### Requirement: Reward Management (Parent Only)
Parents MUST be able to create, update, and delete rewards through dialog forms with validation.

#### Scenario: Open create reward dialog
- **GIVEN** an authenticated parent on the rewards page
- **WHEN** they click "New Reward" button in the header
- **THEN** a dialog opens with title "Create New Reward"
- **AND** shows form fields: name (required), karma cost (required), image URL (optional), description (optional)
- **AND** description field is initially hidden with "+ Description" button shown

#### Scenario: Create reward with required fields only
- **GIVEN** the create reward dialog is open
- **WHEN** the parent fills in name "Extra Screen Time" and karma cost "50"
- **AND** clicks "Create Reward"
- **THEN** the API endpoint POST `/v1/families/{familyId}/rewards` is called
- **AND** the new reward appears in the grid
- **AND** the dialog closes

#### Scenario: Create reward with all fields
- **GIVEN** the create reward dialog is open
- **WHEN** the parent fills name, karma cost, clicks "+ Description", fills description, and fills image URL
- **AND** clicks "Create Reward"
- **THEN** the reward is created with all fields
- **AND** the reward card displays the custom image

#### Scenario: Validate required fields on create
- **GIVEN** the create reward dialog is open
- **WHEN** the parent clicks "Create Reward" without filling name or karma cost
- **THEN** the form prevents submission
- **AND** validation errors are shown for missing fields

#### Scenario: Open edit reward dialog
- **GIVEN** a parent viewing a reward card
- **WHEN** they click the menu (three dots)
- **AND** click "Edit"
- **THEN** a dialog opens with title "Edit Reward"
- **AND** the form fields are pre-filled with current reward values
- **AND** description field is shown if reward has description

#### Scenario: Update reward fields
- **GIVEN** the edit reward dialog is open with existing reward data
- **WHEN** the parent changes the name and karma cost
- **AND** clicks "Update Reward"
- **THEN** the API endpoint PATCH `/v1/families/{familyId}/rewards/{rewardId}` is called
- **AND** the reward card updates with new values
- **AND** the dialog closes

#### Scenario: Delete reward
- **GIVEN** a parent viewing a reward card with no pending claims
- **WHEN** they click the menu
- **AND** click "Delete"
- **THEN** the API endpoint DELETE `/v1/families/{familyId}/rewards/{rewardId}` is called
- **AND** the reward is removed from the grid

#### Scenario: Cannot delete reward with pending claims
- **GIVEN** a reward has one or more pending claims
- **WHEN** a parent attempts to delete it
- **THEN** the API responds with 409 Conflict
- **AND** an error message is displayed to the parent
- **AND** the reward remains in the grid

#### Scenario: Child cannot access reward management
- **GIVEN** an authenticated child on the rewards page
- **WHEN** viewing reward cards
- **THEN** the "New Reward" button is not displayed
- **AND** reward card dropdown menus do not show "Edit" or "Delete" options

### Requirement: State Management
The rewards page MUST use Redux for state management with slices for rewards and claims, coordinated with karma state.

#### Scenario: Fetch rewards on page load
- **GIVEN** the rewards page component mounts
- **WHEN** useEffect runs on mount
- **THEN** the Redux thunk `fetchRewards(familyId)` is dispatched
- **AND** the API GET `/v1/families/{familyId}/rewards` is called
- **AND** the Redux rewards slice state is updated with fetched rewards
- **AND** loading state transitions: false → true → false

#### Scenario: Fetch claims on page load
- **GIVEN** the rewards page component mounts
- **WHEN** useEffect runs on mount
- **THEN** the Redux thunk `fetchClaims(familyId)` is dispatched
- **AND** the API GET `/v1/families/{familyId}/claims` is called
- **AND** the Redux claims slice state is updated with fetched claims

#### Scenario: Optimistic favourite toggle
- **GIVEN** a user clicks the favourite button on a reward
- **WHEN** the Redux thunk `toggleFavourite` is dispatched
- **THEN** the Redux state immediately updates the favourite status
- **AND** the heart icon updates immediately
- **AND** the API call is made in the background
- **AND** if the API call fails, the state is reverted and error shown

#### Scenario: Optimistic reward creation
- **GIVEN** a parent submits the create reward form
- **WHEN** the Redux thunk `createReward` is dispatched
- **THEN** a temporary reward is added to Redux state immediately
- **AND** the reward appears in the grid
- **AND** the API response updates the temporary reward with real ID and timestamps

#### Scenario: Handle API errors gracefully
- **GIVEN** any Redux thunk makes an API call
- **WHEN** the API responds with an error
- **THEN** the Redux error state is updated with error message
- **AND** a toast or error notification is shown to the user
- **AND** optimistic updates are reverted if applicable

### Requirement: Internationalization
All text content on the rewards page MUST be translated and support both English (en-US) and Dutch (nl-NL) locales.

#### Scenario: Display rewards page in English
- **GIVEN** the user's locale is set to "en-US"
- **WHEN** the rewards page loads
- **THEN** all text is displayed in English
- **AND** the page title shows "Rewards"
- **AND** the karma balance shows "Your Available Karma"
- **AND** buttons show English text ("Claim", "New Reward", etc.)

#### Scenario: Display rewards page in Dutch
- **GIVEN** the user's locale is set to "nl-NL"
- **WHEN** the rewards page loads
- **THEN** all text is displayed in Dutch
- **AND** the page title shows Dutch translation
- **AND** all labels, buttons, and messages use Dutch translations

#### Scenario: All translation keys exist
- **GIVEN** the rewards page implementation
- **WHEN** rendering any text content
- **THEN** every text string is retrieved from the dictionary using a translation key
- **AND** no hardcoded English strings exist in components

### Requirement: End-to-End Testing
The rewards page MUST have comprehensive E2E tests using Playwright with page object pattern and data-testid attributes.

#### Scenario: E2E test for viewing rewards
- **GIVEN** a test user with test data in the database
- **WHEN** the E2E test navigates to the rewards page
- **THEN** the test verifies rewards are displayed
- **AND** verifies karma balance is shown
- **AND** verifies reward cards have correct data

#### Scenario: E2E test for claiming reward
- **GIVEN** a test user with sufficient karma
- **WHEN** the test clicks "Claim" on a reward
- **AND** confirms in the claim sheet
- **THEN** the test verifies the claim button updates to "Pending"
- **AND** verifies the API call was made
- **AND** verifies the claim appears in the claims list

#### Scenario: E2E test for favouriting reward
- **GIVEN** the E2E test has navigated to rewards page
- **WHEN** the test clicks the heart icon on a reward
- **THEN** the test verifies the heart fills with color
- **AND** verifies the progress bar appears
- **AND** verifies the API was called

#### Scenario: E2E test for parent creating reward
- **GIVEN** a test parent user
- **WHEN** the test clicks "New Reward"
- **AND** fills the form and submits
- **THEN** the test verifies the new reward appears in the grid
- **AND** verifies it has the correct name and karma cost

#### Scenario: Page object provides locators and helpers
- **GIVEN** the RewardsPage page object class
- **WHEN** tests use the page object
- **THEN** all locators use data-testid attributes
- **AND** helper methods encapsulate navigation and interaction logic
- **AND** tests are readable and maintainable

#### Scenario: All user workflows are tested
- **GIVEN** the complete E2E test suite
- **WHEN** tests run
- **THEN** every user workflow is covered: view, favourite, claim, cancel claim, create, edit, delete
- **AND** both parent and child user journeys are tested
- **AND** responsive layouts are tested (mobile, tablet, desktop)

### Requirement: Unit Testing
Redux slices for rewards and claims MUST have 100% unit test coverage.

#### Scenario: Unit test for fetchRewards thunk
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing the fetchRewards thunk
- **THEN** tests cover: successful fetch, API error, loading states
- **AND** tests verify state updates correctly in each case

#### Scenario: Unit test for createReward thunk
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing the createReward thunk
- **THEN** tests cover: successful creation, API error, optimistic update
- **AND** tests verify temporary reward is added and then updated with API response

#### Scenario: Unit test for toggleFavourite thunk
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing the toggleFavourite thunk
- **THEN** tests cover: successful toggle, API error with revert, both on and off states
- **AND** tests verify optimistic update and rollback on error

#### Scenario: Unit test for all selectors
- **GIVEN** the rewards slice unit test suite
- **WHEN** testing selectors
- **THEN** every selector is tested: selectRewards, selectRewardsLoading, selectRewardById, selectFavouritedRewards
- **AND** tests verify correct data is returned from state

#### Scenario: Unit test for claims slice
- **GIVEN** the claims slice unit test suite
- **WHEN** running tests
- **THEN** all thunks are tested: fetchClaims, claimReward, cancelClaim
- **AND** all selectors are tested: selectClaims, selectPendingClaims, selectClaimByReward
- **AND** coverage is 100%

### Requirement: Accessibility
The rewards page MUST follow accessibility best practices with proper ARIA labels and keyboard navigation.

#### Scenario: Keyboard navigation through rewards
- **GIVEN** a user navigating with keyboard only
- **WHEN** they tab through the rewards page
- **THEN** all interactive elements are reachable
- **AND** focus indicators are visible
- **AND** Enter or Space activates buttons

#### Scenario: Screen reader announces reward information
- **GIVEN** a screen reader user on the rewards page
- **WHEN** navigating to a reward card
- **THEN** the reward name, karma cost, and status are announced
- **AND** buttons have descriptive labels
- **AND** favourite toggle announces current state

#### Scenario: Form inputs have proper labels
- **GIVEN** the create/edit reward dialog
- **WHEN** a screen reader user navigates the form
- **THEN** all inputs have associated labels
- **AND** required fields are indicated
- **AND** error messages are announced
