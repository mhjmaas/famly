# web-family Specification

## Purpose
Provides a complete family management interface in the web application that allows parents to view, manage roles, remove members, grant karma, and add new family members through an intuitive card-based UI.

## ADDED Requirements

### Requirement: Display family members in card layout
The web application MUST display all family members in a responsive card grid with member details.

#### Scenario: Family members displayed on page load
- **GIVEN** an authenticated parent user in a family with 3 members
- **WHEN** the user navigates to `/app/family`
- **THEN** the page displays 3 member cards in a grid layout
- **AND** each card shows member avatar with initials, name, calculated age, role badge, and karma count

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

#### Scenario: Actions dropdown visible for parent users
- **GIVEN** an authenticated parent user
- **WHEN** viewing a member card
- **THEN** a dropdown menu button (three dots) is visible
- **AND** the dropdown contains "Give Karma", "Edit Role", and "Remove" options

#### Scenario: Actions dropdown hidden for child users
- **GIVEN** an authenticated child user
- **WHEN** viewing a member card
- **THEN** no dropdown menu button is visible
- **AND** the card displays information only (no actions)

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

### Requirement: Update member role
Parents MUST be able to update any family member's role between Parent and Child through a dialog interface.

#### Scenario: Open edit role dialog
- **GIVEN** an authenticated parent user
- **WHEN** the user clicks "Edit Role" in a member's dropdown menu
- **THEN** the Edit Role dialog opens
- **AND** the dialog displays the member's current name
- **AND** the dialog shows a role selector with "Parent" and "Child" options
- **AND** the current role is pre-selected

#### Scenario: Update role from Child to Parent
- **GIVEN** an authenticated parent user viewing the edit role dialog for a Child member
- **WHEN** the user selects "Parent" and clicks "Save Changes"
- **THEN** the API request PATCH /v1/families/{familyId}/members/{memberId} is sent with { "role": "Parent" }
- **AND** the dialog shows a loading state during the request
- **AND** on success, a success message "Member role updated successfully" is displayed
- **AND** the dialog closes
- **AND** the member card updates to show "Parent" role badge

#### Scenario: Update role from Parent to Child
- **GIVEN** an authenticated parent user viewing the edit role dialog for a Parent member
- **WHEN** the user selects "Child" and clicks "Save Changes"
- **THEN** the API request PATCH /v1/families/{familyId}/members/{memberId} is sent with { "role": "Child" }
- **AND** on success, the member card updates to show "Child" role badge

#### Scenario: Save button disabled when role unchanged
- **GIVEN** an authenticated parent user viewing the edit role dialog
- **WHEN** the selected role matches the member's current role
- **THEN** the "Save Changes" button is disabled

#### Scenario: Cancel edit role dialog
- **GIVEN** an authenticated parent user viewing the edit role dialog
- **WHEN** the user clicks "Cancel"
- **THEN** the dialog closes
- **AND** no API request is made
- **AND** the member's role remains unchanged

#### Scenario: Error handling for role update
- **GIVEN** an authenticated parent user attempting to update a role
- **WHEN** the API request fails with a 403 error
- **THEN** an error message "You don't have permission to perform this action" is displayed
- **AND** the dialog remains open
- **AND** the member's role remains unchanged

#### Scenario: Role update for non-existent member
- **GIVEN** an authenticated parent user attempting to update a role
- **WHEN** the API request fails with a 404 error
- **THEN** an error message "Member not found" is displayed

### Requirement: Remove family member
Parents MUST be able to remove family members through a confirmation dialog with safeguards against removing the last parent.

#### Scenario: Open remove member dialog
- **GIVEN** an authenticated parent user
- **WHEN** the user clicks "Remove" in a member's dropdown menu
- **THEN** an AlertDialog opens
- **AND** the dialog displays "Remove Family Member" title
- **AND** the dialog shows "Are you sure you want to remove {name} from the family?" description
- **AND** the dialog shows "This action cannot be undone." warning
- **AND** the dialog has "Cancel" and "Remove Member" buttons

#### Scenario: Confirm member removal
- **GIVEN** an authenticated parent user viewing the remove member dialog
- **AND** the family has at least 2 parents or the target is a child
- **WHEN** the user clicks "Remove Member"
- **THEN** the API request DELETE /v1/families/{familyId}/members/{memberId} is sent
- **AND** the dialog shows a loading state during the request
- **AND** on success, a success message "Member removed successfully" is displayed
- **AND** the dialog closes
- **AND** the member card is removed from the grid
- **AND** the family members list is updated

#### Scenario: Cancel member removal
- **GIVEN** an authenticated parent user viewing the remove member dialog
- **WHEN** the user clicks "Cancel"
- **THEN** the dialog closes
- **AND** no API request is made
- **AND** the member remains in the family

#### Scenario: Prevent removing last parent
- **GIVEN** an authenticated parent user
- **AND** the family has exactly 1 parent member
- **WHEN** the user attempts to remove that parent member
- **THEN** an error message "Cannot remove the last parent from the family" is displayed
- **AND** the remove action is prevented

#### Scenario: Error handling for member removal
- **GIVEN** an authenticated parent user attempting to remove a member
- **WHEN** the API request fails with a 403 error
- **THEN** an error message "You don't have permission to perform this action" is displayed
- **AND** the dialog remains open
- **AND** the member is not removed

#### Scenario: Removal of non-existent member
- **GIVEN** an authenticated parent user attempting to remove a member
- **WHEN** the API request fails with a 404 error
- **THEN** an error message "Member not found" is displayed

### Requirement: Grant or deduct karma
Parents MUST be able to grant positive or negative karma to family members with a required explanatory message through a dialog interface.

#### Scenario: Open give karma dialog
- **GIVEN** an authenticated parent user
- **WHEN** the user clicks "Give Karma" in a member's dropdown menu
- **THEN** the Give Karma dialog opens
- **AND** the dialog displays "Give Karma to {name}" title
- **AND** the dialog shows radio buttons for "Positive (Award)" and "Negative (Deduct)" karma type
- **AND** "Positive" is selected by default
- **AND** the dialog shows an amount number input
- **AND** the dialog shows a message textarea with "Message is required" label

#### Scenario: Grant positive karma
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **AND** the member has 100 karma
- **WHEN** the user selects "Positive", enters amount "50", enters message "Great job on homework"
- **AND** clicks "Give Karma"
- **THEN** the API request POST /v1/families/{familyId}/karma/grant is sent with { "userId": "{memberId}", "amount": 50, "description": "Great job on homework" }
- **AND** the dialog shows a loading state during the request
- **AND** on success, a success message "Karma updated successfully" is displayed
- **AND** the dialog closes
- **AND** the member card updates to show karma "150"

#### Scenario: Deduct karma (negative amount)
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **AND** the member has 100 karma
- **WHEN** the user selects "Negative", enters amount "30", enters message "Forgot to clean room"
- **AND** clicks "Give Karma"
- **THEN** the API request POST /v1/families/{familyId}/karma/grant is sent with { "userId": "{memberId}", "amount": -30, "description": "Forgot to clean room" }
- **AND** on success, the member card updates to show karma "70"

#### Scenario: Validation error for empty message
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **WHEN** the user enters amount "50" but leaves message empty
- **AND** clicks "Give Karma"
- **THEN** the submit button is disabled
- **OR** a validation error "Message is required" is displayed

#### Scenario: Validation error for zero amount
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **WHEN** the user enters amount "0"
- **THEN** a validation error "Amount must be between 1 and 100,000" is displayed
- **AND** the submit button is disabled

#### Scenario: Validation error for excessive amount
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **WHEN** the user enters amount "100001"
- **THEN** a validation error "Amount must be between 1 and 100,000" is displayed
- **AND** the submit button is disabled

#### Scenario: Validation error for message too long
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **WHEN** the user enters a message exceeding 500 characters
- **THEN** a validation error is displayed
- **AND** the submit button is disabled

#### Scenario: Cancel give karma dialog
- **GIVEN** an authenticated parent user viewing the give karma dialog
- **WHEN** the user clicks "Cancel"
- **THEN** the dialog closes
- **AND** no API request is made
- **AND** the member's karma remains unchanged
- **AND** form inputs are reset

#### Scenario: Error handling for karma grant
- **GIVEN** an authenticated parent user attempting to grant karma
- **WHEN** the API request fails with a 403 error
- **THEN** an error message "You don't have permission to perform this action" is displayed
- **AND** the dialog remains open

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
