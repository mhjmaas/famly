# web-family Specification

## Purpose
TBD - created by archiving change implement-family-page. Update Purpose after archive.
## Requirements
### Requirement: Display family members in card layout
The web application MUST display all family members in a responsive card grid with member details and navigation to detail pages.

#### Scenario: Family members displayed on page load
- **GIVEN** an authenticated parent user in a family with 3 members
- **WHEN** the user navigates to `/app/family`
- **THEN** the page displays 3 member cards in a grid layout
- **AND** each card shows member avatar with initials, name, calculated age, role badge, and karma count
- **AND** each card is clickable to navigate to the member detail page

#### Scenario: Member avatar shows initials
- **GIVEN** a family member named "John Doe"
- **WHEN** the member card renders
- **THEN** the avatar displays "JD" as initials
- **AND** the avatar uses a fallback background color

#### Scenario: Member age is calculated from birthdate
- **GIVEN** a family member with birthdate "2010-05-15"
- **AND** today's date is 2025-11-05
- **WHEN** the member card renders
- **THEN** the card displays "15 years old"

#### Scenario: Role badge styled by role type
- **GIVEN** a family member with role "Parent"
- **WHEN** the member card renders
- **THEN** the role badge displays "Parent" with primary color styling
- **AND** a child member displays "Child" with alternate color styling

#### Scenario: Karma count displayed with icon
- **GIVEN** a family member with totalKarma 150
- **WHEN** the member card renders
- **THEN** the card displays "150" next to a Sparkles icon
- **AND** the icon uses primary color with fill

#### Scenario: Card is clickable and navigates to detail page
- **GIVEN** an authenticated user viewing a member card
- **WHEN** the user clicks on the card
- **THEN** the browser navigates to `/app/family/{memberId}`
- **AND** the member detail page loads

#### Scenario: Card has hover state indicating clickability
- **GIVEN** an authenticated user viewing a member card
- **WHEN** the user hovers over the card
- **THEN** the card displays a hover effect (shadow or background change)
- **AND** the cursor changes to pointer

#### Scenario: Actions dropdown removed from member cards
- **GIVEN** an authenticated parent user
- **WHEN** viewing a member card
- **THEN** no dropdown menu button (three dots) is visible
- **AND** the card only displays information and navigation

#### Scenario: Empty state when no members
- **GIVEN** a family with only the current user as a member
- **WHEN** the user navigates to `/app/family`
- **THEN** an empty state card is displayed
- **AND** the card shows "No family members yet" message
- **AND** the card shows "Click 'Add Member' to get started" description for parents

#### Scenario: Loading state while fetching members
- **GIVEN** an authenticated user
- **WHEN** the family page is loading member data
- **THEN** a loading indicator is displayed
- **AND** member cards are not visible until data loads

#### Scenario: Error state when fetch fails
- **GIVEN** an authenticated user
- **WHEN** the API request to fetch families fails
- **THEN** an error message is displayed
- **AND** the message says "Failed to load family members"

#### Scenario: Responsive grid layout on desktop
- **GIVEN** a viewport width >= 1024px
- **WHEN** displaying 6 family members
- **THEN** the members are arranged in a 3-column grid
- **AND** each card has equal width

#### Scenario: Responsive grid layout on tablet
- **GIVEN** a viewport width between 768px and 1023px
- **WHEN** displaying 6 family members
- **THEN** the members are arranged in a 2-column grid

#### Scenario: Responsive grid layout on mobile
- **GIVEN** a viewport width < 768px
- **WHEN** displaying 6 family members
- **THEN** the members are arranged in a 1-column grid
- **AND** cards stack vertically

### Requirement: Add new family member
Parents MUST be able to add new family members through a dialog form that collects email, password, name, birthdate, and role.

#### Scenario: Open add member dialog from desktop button
- **GIVEN** an authenticated parent user on desktop (viewport >= 1024px)
- **WHEN** the user clicks the "Add Member" button in the page header
- **THEN** the Add Member dialog opens
- **AND** the dialog displays "Add Family Member" title
- **AND** the dialog shows form fields: Email, Password, Name, Birthdate, Role
- **AND** all fields are empty
- **AND** Role defaults to "Child"

#### Scenario: Open add member dialog from mobile button
- **GIVEN** an authenticated parent user on mobile (viewport < 768px)
- **WHEN** the user clicks the "+" icon button in the mobile header
- **THEN** the Add Member dialog opens with the same form fields

#### Scenario: Add new child member
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user fills in:
  - Email: "newkid@example.com"
  - Password: "securepass123"
  - Name: "New Kid"
  - Birthdate: "2015-03-20"
  - Role: "Child"
- **AND** clicks "Add Member"
- **THEN** the API request POST /v1/families/{familyId}/members is sent with the form data
- **AND** the dialog shows a loading state during the request
- **AND** on success, a success message "Member added successfully" is displayed
- **AND** the dialog closes
- **AND** the families list is refetched
- **AND** the new member appears in the member grid

#### Scenario: Add new parent member
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user fills in all fields and selects Role "Parent"
- **AND** clicks "Add Member"
- **THEN** the new parent member is added to the family

#### Scenario: Validation error for missing email
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user submits the form without entering an email
- **THEN** a validation error "Email is required" or similar is displayed
- **AND** the submit button is disabled or form submission is prevented

#### Scenario: Validation error for invalid email
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user enters an invalid email format (e.g., "notanemail")
- **THEN** a validation error "Please enter a valid email address" is displayed

#### Scenario: Validation error for short password
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user enters a password with less than 8 characters
- **THEN** a validation error "Password must be at least 8 characters" is displayed

#### Scenario: Validation error for missing name
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user submits the form without entering a name
- **THEN** a validation error "Name is required" or similar is displayed

#### Scenario: Validation error for missing birthdate
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user submits the form without selecting a birthdate
- **THEN** a validation error "Birthdate is required" or similar is displayed

#### Scenario: Validation error for future birthdate
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user selects a birthdate in the future
- **THEN** a validation error "Birthdate cannot be in the future" is displayed

#### Scenario: Cancel add member dialog
- **GIVEN** an authenticated parent user viewing the add member dialog
- **WHEN** the user clicks "Cancel"
- **THEN** the dialog closes
- **AND** no API request is made
- **AND** form inputs are reset

#### Scenario: Error handling for add member
- **GIVEN** an authenticated parent user attempting to add a member
- **WHEN** the API request fails with a 400 error (e.g., email already exists)
- **THEN** an error message from the API is displayed
- **AND** the dialog remains open
- **AND** the user can correct the input and retry

#### Scenario: Add member button hidden for child users
- **GIVEN** an authenticated child user
- **WHEN** viewing the family page
- **THEN** the "Add Member" button is not visible
- **AND** the "+" icon button is not visible on mobile

### Requirement: Internationalization support
All UI text MUST be translatable and display in the user's selected language (English or Dutch).

#### Scenario: Family page displays in English
- **GIVEN** a user with language preference set to English
- **WHEN** the user views the family page
- **THEN** all text displays in English
- **AND** the page title shows "Family Members"
- **AND** buttons show "Add Member", "Edit Role", "Remove", "Give Karma"
- **AND** dialog titles and descriptions are in English

#### Scenario: Family page displays in Dutch
- **GIVEN** a user with language preference set to Dutch
- **WHEN** the user views the family page
- **THEN** all text displays in Dutch
- **AND** the page title shows the Dutch translation
- **AND** buttons show Dutch translations
- **AND** dialog titles and descriptions are in Dutch

#### Scenario: Error messages are translated
- **GIVEN** a user with language preference set to Dutch
- **WHEN** an error occurs (e.g., "Failed to load family members")
- **THEN** the error message displays in Dutch

### Requirement: Redux state management
Family data MUST be managed through a Redux slice with async thunks for all API operations.

#### Scenario: Family slice initialized with null state
- **GIVEN** the Redux store is created
- **WHEN** the family slice initializes
- **THEN** the initial state has `families: null`, `currentFamily: null`, `isLoading: false`, `error: null`
- **AND** all operation states are initialized to `{ isLoading: false, error: null }`

#### Scenario: Fetch families thunk dispatched
- **GIVEN** the family page mounts
- **WHEN** the `fetchFamilies` async thunk is dispatched
- **THEN** the Redux state sets `isLoading: true`
- **AND** the API client calls GET /v1/families
- **AND** on success, the Redux state updates `families` with response data
- **AND** the Redux state sets `isLoading: false`
- **AND** the `currentFamily` selector returns `families[0]`

#### Scenario: Update member role thunk success
- **GIVEN** the Redux store has families loaded
- **WHEN** the `updateMemberRole` async thunk is dispatched with familyId, memberId, and new role
- **THEN** the Redux state sets `operations.updateRole.isLoading: true`
- **AND** the API client calls PATCH /v1/families/{familyId}/members/{memberId}
- **AND** on success, the `fetchFamilies` thunk is dispatched to refetch data
- **AND** the Redux state sets `operations.updateRole.isLoading: false`

#### Scenario: Remove member thunk success
- **GIVEN** the Redux store has families loaded
- **WHEN** the `removeFamilyMember` async thunk is dispatched
- **THEN** the Redux state sets `operations.removeMember.isLoading: true`
- **AND** the API client calls DELETE /v1/families/{familyId}/members/{memberId}
- **AND** on success, the `fetchFamilies` thunk is dispatched to refetch data
- **AND** the Redux state sets `operations.removeMember.isLoading: false`

#### Scenario: Grant karma thunk success
- **GIVEN** the Redux store has families loaded
- **WHEN** the `grantMemberKarma` async thunk is dispatched with amount and description
- **THEN** the Redux state sets `operations.grantKarma.isLoading: true`
- **AND** the API client calls POST /v1/families/{familyId}/karma/grant
- **AND** on success, the `fetchFamilies` thunk is dispatched to refetch data
- **AND** the Redux state sets `operations.grantKarma.isLoading: false`

#### Scenario: Add member thunk success
- **GIVEN** the Redux store has families loaded
- **WHEN** the `addFamilyMember` async thunk is dispatched with member data
- **THEN** the Redux state sets `operations.addMember.isLoading: true`
- **AND** the API client calls POST /v1/families/{familyId}/members
- **AND** on success, the `fetchFamilies` thunk is dispatched to refetch data
- **AND** the Redux state sets `operations.addMember.isLoading: false`

#### Scenario: Thunk error handling
- **GIVEN** any async thunk is dispatched
- **WHEN** the API request fails with an ApiError
- **THEN** the Redux state sets the corresponding operation error with the error message
- **AND** the Redux state sets the corresponding operation `isLoading: false`
- **AND** the families data remains unchanged

#### Scenario: Selectors return correct data
- **GIVEN** the Redux store has families loaded
- **WHEN** the `selectFamilyMembers` selector is called
- **THEN** it returns the members array from currentFamily
- **AND** the `selectOperationLoading('updateRole')` selector returns the loading state for role updates
- **AND** the `selectOperationError('grantKarma')` selector returns the error for karma grants

### Requirement: Member detail page display
The web application MUST provide a dedicated detail page for each family member showing comprehensive information and management options.

#### Scenario: Navigate to member detail page
- **GIVEN** an authenticated user viewing the family members page
- **WHEN** the user clicks on a member card for member with ID "member123"
- **THEN** the browser navigates to `/app/family/member123`
- **AND** the member detail page loads

#### Scenario: Member detail page displays header information
- **GIVEN** an authenticated user viewing member detail page for "John Doe" born "2010-05-15"
- **WHEN** the page renders
- **THEN** the page displays "John Doe" as the main heading (h1)
- **AND** the page displays "15 years old" as the description below the name
- **AND** the heading and description are left-aligned

#### Scenario: Member detail page displays avatar and karma in top-right
- **GIVEN** an authenticated user viewing member detail page for "John Doe" with 245 karma
- **WHEN** the page renders
- **THEN** an avatar with initials "JD" displays in the top-right corner
- **AND** the karma amount "245 Karma" displays next to the avatar with a Sparkles icon
- **AND** the karma display has a subtle background (primary/5 opacity)

#### Scenario: Breadcrumb navigation on detail page
- **GIVEN** an authenticated user viewing member detail page for "John Doe"
- **WHEN** the page renders
- **THEN** breadcrumb navigation displays at the top
- **AND** the breadcrumb shows "Family Members > John Doe"
- **AND** "Family Members" is a clickable link to `/app/family`
- **AND** "John Doe" is the current page (not clickable)

#### Scenario: Back button on mobile
- **GIVEN** an authenticated user on mobile (viewport < 1024px)
- **WHEN** viewing the member detail page
- **THEN** a "Back to Family" button displays with an arrow icon
- **AND** clicking the button navigates to `/app/family`

#### Scenario: Back button hidden on desktop
- **GIVEN** an authenticated user on desktop (viewport >= 1024px)
- **WHEN** viewing the member detail page
- **THEN** the "Back to Family" button is hidden
- **AND** breadcrumb navigation is used instead

#### Scenario: Actions dropdown for parent users positioned at tab level
- **GIVEN** an authenticated parent user viewing a member detail page
- **WHEN** the page renders
- **THEN** a dropdown menu button (three dots) displays at the same level as the tabs
- **AND** the dropdown is aligned to the right
- **AND** the dropdown is outside the tab content area
- **AND** the dropdown contains "Edit Member" and "Remove Member" options

#### Scenario: Actions dropdown hidden for child users
- **GIVEN** an authenticated child user viewing a member detail page
- **WHEN** the page renders
- **THEN** no dropdown menu button is visible

#### Scenario: Edit member dialog from detail page reuses existing component
- **GIVEN** an authenticated parent user viewing member detail page
- **WHEN** the user clicks "Edit Member" from the dropdown
- **THEN** the existing `EditRoleDialog` component opens
- **AND** the dialog functions identically to the family overview implementation
- **AND** on successful role update, the member detail page refreshes with updated data

#### Scenario: Remove member dialog from detail page reuses existing component
- **GIVEN** an authenticated parent user viewing member detail page
- **WHEN** the user clicks "Remove Member" from the dropdown
- **THEN** the existing `RemoveMemberDialog` component opens
- **AND** the dialog functions identically to the family overview implementation
- **AND** on successful removal, the user is redirected to `/app/family`

### Requirement: Member detail tabs navigation
The web application MUST provide tab navigation on the member detail page with a "Give Karma" tab and actions menu at the same level.

#### Scenario: Tabs display with actions menu at same level
- **GIVEN** an authenticated parent user viewing a member detail page
- **WHEN** the page renders
- **THEN** a flex container displays below the header
- **AND** the tabs component is center-aligned within the container
- **AND** the actions dropdown menu is right-aligned within the same container
- **AND** both tabs and actions menu are at the same vertical level
- **AND** a single tab labeled "Give Karma" is visible

#### Scenario: Give Karma tab is selected by default
- **GIVEN** an authenticated user viewing a member detail page
- **WHEN** the page renders
- **THEN** the "Give Karma" tab is selected by default
- **AND** the karma grant card displays in the tab content area

#### Scenario: Actions menu positioned outside tab content
- **GIVEN** an authenticated parent user viewing a member detail page
- **WHEN** the page renders
- **THEN** the actions dropdown menu is not inside the tab content area
- **AND** the menu is accessible regardless of which tab is active

### Requirement: Simplified karma grant card
The web application MUST provide a simplified karma grant interface that accepts positive or negative amounts directly without radio button selection.

#### Scenario: Karma card displays on Give Karma tab
- **GIVEN** an authenticated parent user viewing the Give Karma tab
- **WHEN** the tab content renders
- **THEN** a card displays with karma grant form
- **AND** the card contains a karma amount input field
- **AND** the card contains a description textarea
- **AND** the card contains a "Give Karma" button with Sparkles icon

#### Scenario: Karma amount input accepts positive and negative numbers
- **GIVEN** an authenticated parent user viewing the karma grant card
- **WHEN** the user enters "25" in the amount field
- **THEN** the input accepts the value
- **WHEN** the user enters "-10" in the amount field
- **THEN** the input accepts the value

#### Scenario: Helper text explains positive/negative input
- **GIVEN** an authenticated parent user viewing the karma grant card
- **WHEN** the karma amount field renders
- **THEN** helper text displays below the input
- **AND** the text explains "Use positive or negative numbers"

#### Scenario: Description field is required
- **GIVEN** an authenticated parent user viewing the karma grant card
- **WHEN** the description field renders
- **THEN** the field label includes "Description *" indicating it's required
- **AND** a placeholder suggests "Explain why you're giving or deducting karma..."

#### Scenario: Grant positive karma from detail page
- **GIVEN** an authenticated parent user viewing karma card for member with 100 karma
- **WHEN** the user enters amount "50" and description "Great job on homework"
- **AND** clicks "Give Karma"
- **THEN** the API request POST /v1/families/{familyId}/karma/grant is sent with { "userId": "{memberId}", "amount": 50, "description": "Great job on homework" }
- **AND** the button shows loading state during the request
- **AND** on success, a success toast displays "Karma updated successfully"
- **AND** the member's karma updates to "150"
- **AND** the form inputs are cleared

#### Scenario: Deduct karma with negative amount
- **GIVEN** an authenticated parent user viewing karma card for member with 100 karma
- **WHEN** the user enters amount "-30" and description "Forgot to clean room"
- **AND** clicks "Give Karma"
- **THEN** the API request POST /v1/families/{familyId}/karma/grant is sent with { "userId": "{memberId}", "amount": -30, "description": "Forgot to clean room" }
- **AND** on success, the member's karma updates to "70"

#### Scenario: Validation error for empty description
- **GIVEN** an authenticated parent user viewing the karma grant card
- **WHEN** the user enters amount "50" but leaves description empty
- **AND** attempts to submit
- **THEN** the "Give Karma" button is disabled
- **OR** a validation error displays

#### Scenario: Validation error for zero amount
- **GIVEN** an authenticated parent user viewing the karma grant card
- **WHEN** the user enters amount "0"
- **THEN** a validation error displays
- **AND** the submit button is disabled

#### Scenario: Karma grant disabled for child users
- **GIVEN** an authenticated child user viewing a member detail page
- **WHEN** the karma grant card renders
- **THEN** the "Give Karma" button is disabled
- **OR** the entire karma grant section is hidden

#### Scenario: Error handling for karma grant
- **GIVEN** an authenticated parent user attempting to grant karma
- **WHEN** the API request fails
- **THEN** an error toast displays with the error message
- **AND** the form remains populated with the user's input
- **AND** the user can retry

### Requirement: Member activity timeline
The web application MUST display a chronological timeline of the member's activity on their detail page.

#### Scenario: Activity timeline displays below karma card
- **GIVEN** an authenticated user viewing a member detail page
- **WHEN** the page renders
- **THEN** an "Activity Timeline" section displays below the karma card
- **AND** the section has a heading "Activity Timeline"
- **AND** the section has a subtitle "Recent tasks, rewards, and karma changes"

#### Scenario: Activity timeline shows member-specific events
- **GIVEN** an authenticated user viewing member detail page for member "member123"
- **WHEN** the activity timeline renders
- **THEN** only events related to "member123" are displayed
- **AND** events are fetched from `/v1/activity-events` filtered by user ID
- **AND** events are sorted by timestamp descending (most recent first)

#### Scenario: Activity timeline reuses profile component
- **GIVEN** the member detail page implementation
- **WHEN** rendering the activity timeline
- **THEN** the `ActivityTimeline` component from the profile page is reused
- **AND** the component receives member-specific events as props
- **AND** the component displays identically to the profile page timeline

#### Scenario: Activity events grouped by date
- **GIVEN** an activity timeline with events from multiple dates
- **WHEN** the timeline renders
- **THEN** events are grouped under date headers
- **AND** each date header displays the full date format "Monday, November 3, 2025"
- **AND** events under each date are sorted by time descending

#### Scenario: Task completion event displays in timeline
- **GIVEN** a member who completed task "Grocery shopping" with +15 karma
- **WHEN** the activity timeline renders
- **THEN** the event displays with a CheckCircle2 icon
- **AND** the task name displays as the heading
- **AND** the karma change displays as "+15" in green with upward arrow

#### Scenario: Reward claim event displays in timeline
- **GIVEN** a member who claimed reward "Extra Screen Time" with -50 karma
- **WHEN** the activity timeline renders
- **THEN** the event displays with a Gift icon
- **AND** the reward name displays as the heading
- **AND** the karma change displays as "-50" in red with downward arrow

#### Scenario: Karma given event displays in timeline
- **GIVEN** a member who received karma with description "Great behavior"
- **WHEN** the activity timeline renders
- **THEN** the event displays with a Sparkles icon
- **AND** the description displays
- **AND** the karma change displays with appropriate color and arrow

#### Scenario: Empty activity timeline
- **GIVEN** a member with no activity events
- **WHEN** the activity timeline renders
- **THEN** an empty state message displays
- **AND** the message encourages activity participation

### Requirement: Redux state management for member details
The web application MUST provide Redux selectors and state management for member detail page operations.

#### Scenario: Select member by ID
- **GIVEN** the Redux store has families loaded with member "member123"
- **WHEN** the selector `selectFamilyMemberById('member123')` is called
- **THEN** the selector returns the member object with all details
- **AND** the selector returns null if the member is not found

#### Scenario: Karma grant updates both slices
- **GIVEN** the Redux store has families and karma loaded
- **WHEN** the `grantMemberKarma` thunk completes successfully
- **THEN** the `fetchFamilies` thunk is dispatched to refresh family data
- **AND** the karma slice is updated with the new balance
- **AND** both the family view and detail page reflect the updated karma

### Requirement: Internationalization for member detail page
All UI text on the member detail page MUST be translatable and display in the user's selected language.

#### Scenario: Member detail page displays in English
- **GIVEN** a user with language preference set to English
- **WHEN** viewing a member detail page
- **THEN** breadcrumb shows "Family Members"
- **AND** back button shows "Back to Family"
- **AND** tab shows "Give Karma"
- **AND** karma card labels are in English
- **AND** activity timeline heading is "Activity Timeline"

#### Scenario: Member detail page displays in Dutch
- **GIVEN** a user with language preference set to Dutch
- **WHEN** viewing a member detail page
- **THEN** all text displays in Dutch translations
- **AND** breadcrumb shows Dutch translation for "Family Members"
- **AND** all labels, buttons, and messages use Dutch translations

#### Scenario: Validation messages are translated
- **GIVEN** a user with language preference set to Dutch
- **WHEN** a validation error occurs
- **THEN** the error message displays in Dutch

#### Scenario: Success messages are translated
- **GIVEN** a user with language preference set to Dutch
- **WHEN** karma is granted successfully
- **THEN** the success toast displays in Dutch

### Requirement: E2E testing with page object pattern
The web application MUST include comprehensive E2E tests for the member detail page using page objects and data-testid attributes.

#### Scenario: Page object provides locators
- **GIVEN** the E2E test suite
- **WHEN** the `FamilyMemberDetailPage` page object is used
- **THEN** the page object provides locators for all interactive elements
- **AND** all locators use data-testid attributes
- **AND** the page object provides helper methods for common actions

#### Scenario: E2E test navigates to detail page
- **GIVEN** an E2E test for member detail navigation
- **WHEN** the test clicks on a member card
- **THEN** the test verifies navigation to the detail page
- **AND** the test verifies the member name displays correctly

#### Scenario: E2E test grants karma
- **GIVEN** an E2E test for karma grant
- **WHEN** the test enters amount and description
- **AND** clicks "Give Karma"
- **THEN** the test verifies the success message
- **AND** the test verifies the karma amount updates

#### Scenario: E2E test validates required fields
- **GIVEN** an E2E test for validation
- **WHEN** the test attempts to submit with empty description
- **THEN** the test verifies the button is disabled or error displays

#### Scenario: E2E test verifies activity timeline
- **GIVEN** an E2E test for activity timeline
- **WHEN** the detail page loads
- **THEN** the test verifies activity events display
- **AND** the test verifies events are grouped by date

### Requirement: Unit test coverage for Redux
The web application MUST achieve 100% unit test coverage for all Redux code related to member details.

#### Scenario: Unit test for selectFamilyMemberById
- **GIVEN** a unit test for the member selector
- **WHEN** the selector is called with a valid member ID
- **THEN** the test verifies the correct member is returned
- **WHEN** the selector is called with an invalid ID
- **THEN** the test verifies null is returned

#### Scenario: Unit test for karma grant thunk
- **GIVEN** a unit test for the grantMemberKarma thunk
- **WHEN** the thunk is dispatched with valid data
- **THEN** the test verifies the API is called correctly
- **AND** the test verifies fetchFamilies is dispatched
- **AND** the test verifies state updates correctly

#### Scenario: Unit test for error handling
- **GIVEN** a unit test for karma grant error handling
- **WHEN** the API call fails
- **THEN** the test verifies the error is stored in state
- **AND** the test verifies loading state is reset

### Requirement: Responsive design for member detail page
The web application MUST ensure the member detail page is fully responsive across all breakpoints.

#### Scenario: Mobile layout (< 768px)
- **GIVEN** a user viewing the detail page on mobile
- **WHEN** the page renders
- **THEN** the header stacks vertically
- **AND** the avatar and karma display below the name
- **AND** the back button is visible
- **AND** breadcrumbs are hidden
- **AND** all cards are full width

#### Scenario: Tablet layout (768px - 1023px)
- **GIVEN** a user viewing the detail page on tablet
- **WHEN** the page renders
- **THEN** the layout is similar to desktop
- **AND** the back button is hidden
- **AND** breadcrumbs are visible

#### Scenario: Desktop layout (>= 1024px)
- **GIVEN** a user viewing the detail page on desktop
- **WHEN** the page renders
- **THEN** the header displays with name/age on left and avatar/karma on right
- **AND** breadcrumbs are visible
- **AND** the back button is hidden
- **AND** cards have appropriate max-width and spacing

### Requirement: Component decomposition
The web application MUST break down the member detail page into smaller, logical components following existing patterns.

#### Scenario: Header component is separate
- **GIVEN** the member detail page implementation
- **WHEN** the page renders
- **THEN** the header section is implemented as a separate component
- **AND** the component is reusable and testable

#### Scenario: Actions dropdown is separate
- **GIVEN** the member detail page implementation
- **WHEN** the actions menu renders
- **THEN** the dropdown is implemented as a separate component
- **AND** the component handles edit and delete actions

#### Scenario: Karma card is separate
- **GIVEN** the member detail page implementation
- **WHEN** the karma grant section renders
- **THEN** the karma card is implemented as a separate component
- **AND** the component is reusable and testable

