# Tasks: implement-family-page

This file lists the ordered implementation tasks for building the family management page. Each task is small, verifiable, and delivers user-visible progress. Tasks are grouped logically but can be parallelized where noted.

---

## Phase 1: API Client & Types (Foundation)

### Task 1.1: Add family API types to api-client.ts
- [ ] **Description**: Define TypeScript interfaces for all family-related API requests and responses.

**Files to modify**:
- `apps/web/src/lib/api-client.ts`

**Steps**:
1. Add `FamilyWithMembers` interface with `familyId`, `name`, `role`, `linkedAt`, `members[]`
2. Add `FamilyMember` interface with `memberId`, `name`, `birthdate`, `role`, `linkedAt`, `addedBy?`
3. Add `UpdateMemberRoleRequest` interface with `role`
4. Add `UpdateMemberRoleResponse` interface
5. Add `GrantKarmaRequest` interface with `userId`, `amount`, `description?`
6. Add `GrantKarmaResponse` interface with `eventId`, `familyId`, `userId`, `amount`, `totalKarma`, `description`, `grantedBy`, `createdAt`
7. Add `AddFamilyMemberRequest` interface with `email`, `password`, `role`, `name`, `birthdate`
8. Add `AddFamilyMemberResponse` interface

**Acceptance Criteria**:
- All interfaces compile without errors
- Interfaces match backend API response structures from `family.mapper.ts` and API routes

---

### Task 1.2: Implement family API client functions
- [ ] **Description**: Add API client functions for all family operations.

**Files to modify**:
- `apps/web/src/lib/api-client.ts`

**Steps**:
1. Implement `getFamilies()` that calls `GET /v1/families` and returns `FamilyWithMembers[]`
2. Implement `updateMemberRole(familyId, memberId, data)` that calls `PATCH /v1/families/{familyId}/members/{memberId}`
3. Implement `removeMember(familyId, memberId)` that calls `DELETE /v1/families/{familyId}/members/{memberId}`
4. Implement `grantKarma(familyId, data)` that calls `POST /v1/families/{familyId}/karma/grant`
5. Implement `addFamilyMember(familyId, data)` that calls `POST /v1/families/{familyId}/members`
6. Ensure all functions use proper HTTP methods and credentials: "include"
7. Ensure all functions handle errors by throwing `ApiError`

**Acceptance Criteria**:
- All functions compile and export correctly
- Functions can be imported and called in other files
- Error handling follows existing `apiClient` pattern

---

## Phase 2: Redux Slice (State Management)

### Task 2.1: Create family slice with initial state and reducers
- [ ] **Description**: Set up the Redux slice for managing family state.

**Files to create**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Define `FamilyState` interface with `families`, `currentFamily`, `isLoading`, `error`, `operations`
2. Define initial state with all fields set to null/false
3. Create slice with name "family"
4. Add synchronous reducers: `clearFamily`, `setOperationError`, `clearOperationError`
5. Export slice reducer as default
6. Export action creators

**Acceptance Criteria**:
- Slice compiles without errors
- Initial state structure matches design
- Reducers update state correctly

---

### Task 2.2: Implement fetchFamilies async thunk
- [ ] **Description**: Add async thunk for fetching families with members.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Import `createAsyncThunk` from Redux Toolkit
2. Import `getFamilies` from api-client
3. Create `fetchFamilies` thunk that calls `getFamilies()`
4. Add extraReducers to handle pending, fulfilled, rejected states
5. In pending: set `isLoading: true`, clear error
6. In fulfilled: set `families` to payload, set `currentFamily` to `families[0]`, set `isLoading: false`
7. In rejected: set `error` to error message, set `isLoading: false`

**Acceptance Criteria**:
- Thunk compiles and exports correctly
- Pending state sets loading flag
- Fulfilled state updates families and currentFamily
- Rejected state captures error message

---

### Task 2.3: Implement updateMemberRole async thunk
- [ ] **Description**: Add async thunk for updating a member's role.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Create `updateMemberRole` thunk with params: `{ familyId, memberId, role }`
2. Call `updateMemberRole` API function
3. On success, dispatch `fetchFamilies` to refetch updated data
4. Add extraReducers to handle pending, fulfilled, rejected states
5. In pending: set `operations.updateRole.isLoading: true`, clear error
6. In fulfilled: set `operations.updateRole.isLoading: false`
7. In rejected: set `operations.updateRole.error`, set `isLoading: false`

**Acceptance Criteria**:
- Thunk successfully updates member role via API
- After success, families are refetched
- Loading and error states are managed correctly

---

### Task 2.4: Implement removeFamilyMember async thunk
- [ ] **Description**: Add async thunk for removing a member from the family.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Create `removeFamilyMember` thunk with params: `{ familyId, memberId }`
2. Call `removeMember` API function
3. On success, dispatch `fetchFamilies` to refetch updated data
4. Add extraReducers to handle pending, fulfilled, rejected states
5. In pending: set `operations.removeMember.isLoading: true`, clear error
6. In fulfilled: set `operations.removeMember.isLoading: false`
7. In rejected: set `operations.removeMember.error`, set `isLoading: false`

**Acceptance Criteria**:
- Thunk successfully removes member via API
- After success, families are refetched
- Loading and error states are managed correctly

---

### Task 2.5: Implement grantMemberKarma async thunk
- [ ] **Description**: Add async thunk for granting or deducting karma.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Create `grantMemberKarma` thunk with params: `{ familyId, userId, amount, description }`
2. Call `grantKarma` API function
3. On success, dispatch `fetchFamilies` to refetch updated karma totals
4. Add extraReducers to handle pending, fulfilled, rejected states
5. In pending: set `operations.grantKarma.isLoading: true`, clear error
6. In fulfilled: set `operations.grantKarma.isLoading: false`
7. In rejected: set `operations.grantKarma.error`, set `isLoading: false`

**Acceptance Criteria**:
- Thunk successfully grants/deducts karma via API
- After success, families are refetched with updated karma
- Loading and error states are managed correctly

---

### Task 2.6: Implement addFamilyMember async thunk
- [ ] **Description**: Add async thunk for adding a new family member.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Create `addFamilyMember` thunk with params: `{ familyId, email, password, role, name, birthdate }`
2. Call `addFamilyMember` API function
3. On success, dispatch `fetchFamilies` to refetch with new member
4. Add extraReducers to handle pending, fulfilled, rejected states
5. In pending: set `operations.addMember.isLoading: true`, clear error
6. In fulfilled: set `operations.addMember.isLoading: false`
7. In rejected: set `operations.addMember.error`, set `isLoading: false`

**Acceptance Criteria**:
- Thunk successfully adds member via API
- After success, families are refetched with new member
- Loading and error states are managed correctly

---

### Task 2.7: Add family selectors
- [ ] **Description**: Create selector functions for accessing family state.

**Files to modify**:
- `apps/web/src/store/slices/family.slice.ts`

**Steps**:
1. Export `selectFamilies` selector: `(state: RootState) => state.family.families`
2. Export `selectCurrentFamily` selector: `(state: RootState) => state.family.currentFamily`
3. Export `selectFamilyMembers` selector: returns `currentFamily?.members ?? []`
4. Export `selectFamilyLoading` selector: returns `isLoading`
5. Export `selectFamilyError` selector: returns `error`
6. Export `selectOperationLoading` selector factory: `(operation: string) => (state: RootState) => state.family.operations[operation].isLoading`
7. Export `selectOperationError` selector factory: `(operation: string) => (state: RootState) => state.family.operations[operation].error`

**Acceptance Criteria**:
- All selectors compile and export correctly
- Selectors return correct data types
- Selector factories work with operation names

---

### Task 2.8: Register family reducer in store
- [ ] **Description**: Add the family slice to the Redux store.

**Files to modify**:
- `apps/web/src/store/store.ts`

**Steps**:
1. Import `familyReducer` from `./slices/family.slice`
2. Add `family: familyReducer` to the `rootReducer` combineReducers object
3. Ensure TypeScript types update correctly for `RootState`

**Acceptance Criteria**:
- Store compiles without errors
- Family state is accessible via `state.family`
- RootState type includes family slice

---

## Phase 3: Unit Tests for Redux Slice

### Task 3.1: Write unit tests for family slice reducers
- [ ] **Description**: Test synchronous reducers and initial state.

**Files to create**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Set up Jest test file with Redux Toolkit test utilities
2. Test initial state has correct structure
3. Test `clearFamily` reducer clears families and errors
4. Test `setOperationError` sets error for specific operation
5. Test `clearOperationError` clears error for specific operation

**Acceptance Criteria**:
- All tests pass with `pnpm test:unit`
- Tests cover all synchronous reducers
- Tests verify state structure

---

### Task 3.2: Write unit tests for fetchFamilies thunk
- [ ] **Description**: Test the fetchFamilies async thunk.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Mock `getFamilies` API function
2. Test pending state sets `isLoading: true`
3. Test fulfilled state updates `families` and `currentFamily`
4. Test rejected state sets error message
5. Test empty response (no families) sets `families: []`

**Acceptance Criteria**:
- All tests pass
- Tests cover success, failure, and edge cases
- Mocks are properly configured

---

### Task 3.3: Write unit tests for updateMemberRole thunk
- [ ] **Description**: Test the updateMemberRole async thunk.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Mock `updateMemberRole` API function and `fetchFamilies` thunk
2. Test pending state sets operation loading flag
3. Test fulfilled state clears loading flag and triggers refetch
4. Test rejected state sets operation error
5. Test 403 error (unauthorized) sets appropriate error message

**Acceptance Criteria**:
- All tests pass
- Tests cover success and error cases
- Verify refetch is triggered on success

---

### Task 3.4: Write unit tests for removeFamilyMember thunk
- [ ] **Description**: Test the removeFamilyMember async thunk.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Mock `removeMember` API function and `fetchFamilies` thunk
2. Test pending state sets operation loading flag
3. Test fulfilled state clears loading flag and triggers refetch
4. Test rejected state sets operation error
5. Test 404 error (member not found) sets appropriate error

**Acceptance Criteria**:
- All tests pass
- Tests cover success and error cases
- Verify refetch is triggered on success

---

### Task 3.5: Write unit tests for grantMemberKarma thunk
- [ ] **Description**: Test the grantMemberKarma async thunk.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Mock `grantKarma` API function and `fetchFamilies` thunk
2. Test pending state sets operation loading flag
3. Test fulfilled state clears loading flag and triggers refetch
4. Test rejected state sets operation error
5. Test positive amount grant
6. Test negative amount (deduction) grant
7. Test validation error (amount exceeds max) sets error

**Acceptance Criteria**:
- All tests pass
- Tests cover positive and negative karma
- Tests cover validation errors

---

### Task 3.6: Write unit tests for addFamilyMember thunk
- [ ] **Description**: Test the addFamilyMember async thunk.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Mock `addFamilyMember` API function and `fetchFamilies` thunk
2. Test pending state sets operation loading flag
3. Test fulfilled state clears loading flag and triggers refetch
4. Test rejected state sets operation error
5. Test validation error (invalid email) sets error
6. Test 400 error (email already exists) sets error

**Acceptance Criteria**:
- All tests pass
- Tests cover success and validation errors
- Verify refetch is triggered on success

---

### Task 3.7: Write unit tests for family selectors
- [ ] **Description**: Test all selector functions.

**Files to modify**:
- `apps/web/tests/unit/store/family.slice.test.ts`

**Steps**:
1. Create mock Redux state with family data
2. Test `selectFamilies` returns families array
3. Test `selectCurrentFamily` returns first family
4. Test `selectFamilyMembers` returns members array
5. Test `selectFamilyLoading` returns loading state
6. Test `selectFamilyError` returns error
7. Test `selectOperationLoading` returns correct loading state for operation
8. Test `selectOperationError` returns correct error for operation

**Acceptance Criteria**:
- All tests pass
- Tests verify correct data returned
- Tests cover edge cases (null families, empty members)

---

## Phase 4: UI Components

### Task 4.1: Create utility functions for member display
- [ ] **Description**: Implement helper functions used across components.

**Files to create**:
- `apps/web/src/lib/family-utils.ts`

**Steps**:
1. Implement `calculateAge(birthdate: string): number` function
   - Parse birthdate as Date
   - Calculate age based on current date
   - Handle edge cases (birthdays not yet occurred this year)
2. Implement `getInitials(name: string): string` function
   - Split name by spaces
   - Take first letter of each word
   - Join and uppercase
   - Limit to 2 characters
3. Add unit tests for both functions

**Acceptance Criteria**:
- Both functions work correctly
- Edge cases handled (empty names, future dates, etc.)
- Unit tests pass

---

### Task 4.2: Create FamilyMemberCard component
- [ ] **Description**: Build the member card component that displays individual member details.

**Files to create**:
- `apps/web/src/components/family/family-member-card.tsx`

**Steps**:
1. Define `FamilyMemberCardProps` interface
2. Create functional component with props
3. Use shadcn/ui Card, Avatar, Badge, DropdownMenu components
4. Display avatar with `getInitials(member.name)`
5. Display member name and `calculateAge(member.birthdate)` years old
6. Display role badge (styled based on role: Parent or Child)
7. Display karma count with Sparkles icon
8. Conditionally render DropdownMenu (only if `currentUserRole === 'Parent'`)
9. Add dropdown items: "Give Karma", "Edit Role", "Remove"
10. Emit events via props: `onEditRole`, `onRemove`, `onGiveKarma`
11. Use `dict` prop for all text labels

**Acceptance Criteria**:
- Component renders without errors
- Avatar shows correct initials
- Age is calculated correctly
- Role badge is styled correctly
- Karma displays with icon
- Dropdown menu shows for parents only
- Events are emitted correctly

---

### Task 4.3: Create EditRoleDialog component
- [ ] **Description**: Build the dialog for editing a member's role.

**Files to create**:
- `apps/web/src/components/family/edit-role-dialog.tsx`

**Steps**:
1. Define `EditRoleDialogProps` interface
2. Create functional component with props
3. Use shadcn/ui Dialog, DialogContent, DialogHeader, Select, Button, Label
4. Use local state for selected role
5. Pre-select current role when dialog opens
6. Disable "Save Changes" button if role unchanged
7. On submit, call Redux dispatch `updateMemberRole`
8. Show loading state during API call
9. Show error if API call fails
10. Close dialog on success
11. Use `dict` prop for all text labels

**Acceptance Criteria**:
- Dialog opens and closes correctly
- Role selector works
- Submit button disabled when role unchanged
- Loading state shows during API call
- Error messages display correctly
- Success closes dialog and updates UI

---

### Task 4.4: Create RemoveMemberDialog component
- [ ] **Description**: Build the AlertDialog for confirming member removal.

**Files to create**:
- `apps/web/src/components/family/remove-member-dialog.tsx`

**Steps**:
1. Define `RemoveMemberDialogProps` interface
2. Create functional component with props
3. Use shadcn/ui AlertDialog, AlertDialogContent, Button
4. Display member name in confirmation message
5. Check if member is last parent and show error if true
6. On confirm, call Redux dispatch `removeFamilyMember`
7. Show loading state during API call
8. Show error if API call fails
9. Close dialog on success
10. Use `dict` prop for all text labels

**Acceptance Criteria**:
- AlertDialog opens and closes correctly
- Member name displays in message
- Last parent check works
- Loading state shows during API call
- Error messages display correctly
- Success closes dialog and removes member from UI

---

### Task 4.5: Create GiveKarmaDialog component
- [ ] **Description**: Build the dialog for granting/deducting karma.

**Files to create**:
- `apps/web/src/components/family/give-karma-dialog.tsx`

**Steps**:
1. Define `GiveKarmaDialogProps` interface
2. Create functional component with props
3. Use shadcn/ui Dialog, DialogContent, RadioGroup, Input, Textarea, Button, Label
4. Use local state for karmaType, amount, description
5. Default karmaType to "positive"
6. Validate amount (1-100000) and description (required, max 500 chars)
7. Apply sign to amount based on karmaType before submitting
8. On submit, call Redux dispatch `grantMemberKarma`
9. Show loading state during API call
10. Show inline validation errors
11. Show error if API call fails
12. Close dialog and reset form on success
13. Use `dict` prop for all text labels

**Acceptance Criteria**:
- Dialog opens and closes correctly
- Radio buttons toggle between positive/negative
- Amount validation works (1-100000)
- Description validation works (required, max 500)
- Sign applied correctly based on karma type
- Loading state shows during API call
- Inline validation errors display
- Success closes dialog and updates karma in UI
- Form resets on close

---

### Task 4.6: Create AddMemberDialog component
- [ ] **Description**: Build the dialog for adding a new family member.

**Files to create**:
- `apps/web/src/components/family/add-member-dialog.tsx`

**Steps**:
1. Define `AddMemberDialogProps` interface
2. Create functional component with props
3. Use shadcn/ui Dialog, DialogContent, Input, Select, Button, Label
4. Use local state for form fields: email, password, name, birthdate, role
5. Default role to "Child"
6. Validate email (required, valid format)
7. Validate password (required, min 8 chars)
8. Validate name (required, max 120 chars)
9. Validate birthdate (required, not in future, YYYY-MM-DD format)
10. On submit, call Redux dispatch `addFamilyMember`
11. Show loading state during API call
12. Show inline validation errors
13. Show error if API call fails
14. Close dialog and reset form on success
15. Use `dict` prop for all text labels

**Acceptance Criteria**:
- Dialog opens and closes correctly
- All form fields work
- Email validation works
- Password validation works
- Name validation works
- Birthdate validation works (not future, valid format)
- Loading state shows during API call
- Inline validation errors display
- Success closes dialog and new member appears in UI
- Form resets on close

---

### Task 4.7: Create FamilyView component
- [ ] **Description**: Build the main view component that orchestrates all family functionality.

**Files to create**:
- `apps/web/src/components/family/family-view.tsx`

**Steps**:
1. Define `FamilyViewProps` interface
2. Create functional component with props
3. Use Redux hooks to select families, loading, errors
4. Dispatch `fetchFamilies` in useEffect on mount
5. Use local state for dialog open/close and selected member
6. Render loading state (spinner or skeleton)
7. Render error state (Alert with error message)
8. Render empty state when no members
9. Render member grid (responsive: 1 col mobile, 2 col tablet, 3 col desktop)
10. Render FamilyMemberCard for each member
11. Handle member card events: open appropriate dialog with selected member
12. Render EditRoleDialog with open state and selected member
13. Render RemoveMemberDialog with open state and selected member
14. Render GiveKarmaDialog with open state and selected member
15. Render AddMemberDialog with open state
16. Use `mobileActionTrigger` prop to open AddMemberDialog from mobile + button
17. Use `dict` prop for all text labels

**Acceptance Criteria**:
- Component renders without errors
- Fetches families on mount
- Loading state displays correctly
- Error state displays correctly
- Empty state displays correctly
- Member grid renders with correct layout
- Member cards display correctly
- Dialogs open/close correctly
- Selected member passed to dialogs correctly
- Mobile + button triggers add member dialog

---

### Task 4.8: Update FamilyPage to use FamilyView
- [ ] **Description**: Connect the FamilyView component to the page.

**Files to modify**:
- `apps/web/src/app/[lang]/app/family/page.tsx`

**Steps**:
1. Import FamilyView component
2. Add "Add Member" button to page (desktop) that opens AddMemberDialog via state
3. Add "+" icon button to mobile header (via mobileActions prop) that triggers AddMemberDialog
4. Use mobileActionTrigger state to coordinate mobile button with FamilyView
5. Pass lang and dict props to FamilyView
6. Remove placeholder content

**Acceptance Criteria**:
- Page renders FamilyView component
- Desktop "Add Member" button works
- Mobile "+" button works
- Lang and dict props passed correctly
- No placeholder content remains

---

## Phase 5: Internationalization

### Task 5.1: Add English dictionary entries
- [ ] **Description**: Add all family page text to the English dictionary.

**Files to modify**:
- `apps/web/src/dictionaries/en-US.json`

**Steps**:
1. Add `dashboard.pages.family` object with all required keys (see design.md for full list)
2. Include: title, description, addMember, emptyState, memberCard, editRoleDialog, removeDialog, giveKarmaDialog, addMemberDialog, errors
3. Ensure all text is natural and clear in English

**Acceptance Criteria**:
- JSON is valid
- All required keys are present
- Text is clear and grammatically correct

---

### Task 5.2: Add Dutch dictionary entries
- [ ] **Description**: Add all family page text to the Dutch dictionary.

**Files to modify**:
- `apps/web/src/dictionaries/nl-NL.json`

**Steps**:
1. Add `dashboard.pages.family` object with all required keys (see design.md for full list)
2. Translate all English text to Dutch
3. Ensure translations are natural and idiomatic

**Acceptance Criteria**:
- JSON is valid
- All required keys are present (matching English)
- Translations are accurate and natural

---

## Phase 6: E2E Tests

### Task 6.1: Create E2E test setup helpers
- [ ] **Description**: Set up test data factories and helper functions for family E2E tests.

**Files to modify**:
- `apps/web/tests/e2e/helpers/test-data-factory.ts` (or create if doesn't exist)

**Steps**:
1. Add factory function `createTestFamily(memberCount: number, roles: string[])` that creates family with members via API
2. Add factory function `createParentUser()` that creates and logs in a parent user
3. Add factory function `createChildUser()` that creates and logs in a child user
4. Add cleanup function `cleanupTestFamily(familyId: string)` that removes test family

**Acceptance Criteria**:
- Factory functions work correctly
- Test families are created with correct members
- Cleanup function removes test data
- Functions can be reused across test files

---

### Task 6.2: Write E2E test for displaying family members
- [ ] **Description**: Test that family members are displayed correctly.

**Files to create**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create family with 2 parents and 2 children
2. Navigate to `/app/family`
3. Verify page displays 4 member cards
4. Verify each card shows name, age, role badge, karma
5. Verify cards are in grid layout
6. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- All assertions verify correct data
- Test cleans up after itself

---

### Task 6.3: Write E2E test for updating member role
- [ ] **Description**: Test the role update workflow.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with child member
2. Navigate to `/app/family`
3. Click dropdown menu on child member card
4. Click "Edit Role"
5. Select "Parent" role
6. Click "Save Changes"
7. Verify success message appears
8. Verify role badge updates to "Parent"
9. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Role updates successfully
- UI reflects change immediately
- Test cleans up after itself

---

### Task 6.4: Write E2E test for role update authorization
- [ ] **Description**: Test that child users cannot update roles.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create child user and family
2. Navigate to `/app/family`
3. Verify dropdown menu is NOT visible on member cards
4. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Child users cannot access edit role action
- Test cleans up after itself

---

### Task 6.5: Write E2E test for removing member
- [ ] **Description**: Test the member removal workflow.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with 2 parents and 1 child
2. Navigate to `/app/family`
3. Click dropdown menu on child member card
4. Click "Remove"
5. Verify AlertDialog appears with confirmation message
6. Click "Remove Member"
7. Verify success message appears
8. Verify member card is removed from grid
9. Verify family members count decreases
10. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Member is removed successfully
- UI updates immediately
- Test cleans up after itself

---

### Task 6.6: Write E2E test for last parent protection
- [ ] **Description**: Test that the last parent cannot be removed.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with 1 parent and 1 child
2. Navigate to `/app/family`
3. Click dropdown menu on parent member card
4. Click "Remove"
5. Verify error message "Cannot remove the last parent from the family" appears
6. Verify parent member remains in family
7. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Error message displays correctly
- Parent is not removed
- Test cleans up after itself

---

### Task 6.7: Write E2E test for granting positive karma
- [ ] **Description**: Test the karma grant workflow with positive amount.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with child (karma: 100)
2. Navigate to `/app/family`
3. Click dropdown menu on child member card
4. Click "Give Karma"
5. Verify dialog opens with member name
6. Select "Positive" radio button
7. Enter amount "50"
8. Enter message "Great job!"
9. Click "Give Karma"
10. Verify success message appears
11. Verify member card karma updates to "150"
12. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Karma is granted successfully
- UI updates immediately with new karma value
- Test cleans up after itself

---

### Task 6.8: Write E2E test for deducting karma (negative)
- [ ] **Description**: Test the karma deduction workflow with negative amount.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with child (karma: 100)
2. Navigate to `/app/family`
3. Click dropdown menu on child member card
4. Click "Give Karma"
5. Select "Negative" radio button
6. Enter amount "30"
7. Enter message "Forgot chores"
8. Click "Give Karma"
9. Verify success message appears
10. Verify member card karma updates to "70"
11. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Karma is deducted successfully
- UI updates immediately with new karma value
- Test cleans up after itself

---

### Task 6.9: Write E2E test for karma validation errors
- [ ] **Description**: Test that karma validation works correctly.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with child
2. Navigate to `/app/family` and open give karma dialog
3. Test empty message: leave message blank, verify submit disabled or error shown
4. Test zero amount: enter "0", verify error "Amount must be between 1 and 100,000"
5. Test excessive amount: enter "100001", verify error "Amount must be between 1 and 100,000"
6. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Validation errors display correctly
- Submit is prevented when validation fails
- Test cleans up after itself

---

### Task 6.10: Write E2E test for adding new member
- [ ] **Description**: Test the add member workflow.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family
2. Navigate to `/app/family`
3. Click "Add Member" button (desktop)
4. Verify dialog opens
5. Fill in email "newchild@example.com"
6. Fill in password "password123"
7. Fill in name "New Child"
8. Select birthdate "2015-05-10"
9. Select role "Child"
10. Click "Add Member"
11. Verify success message appears
12. Verify new member card appears in grid
13. Verify new member details are correct
14. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Member is added successfully
- UI updates immediately with new member
- Test cleans up after itself

---

### Task 6.11: Write E2E test for add member validation errors
- [ ] **Description**: Test that add member form validation works correctly.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family
2. Navigate to `/app/family` and open add member dialog
3. Test missing email: submit without email, verify error
4. Test invalid email: enter "notanemail", verify error "Please enter a valid email address"
5. Test short password: enter "pass", verify error "Password must be at least 8 characters"
6. Test missing name: submit without name, verify error
7. Test missing birthdate: submit without birthdate, verify error
8. Test future birthdate: select future date, verify error "Birthdate cannot be in the future"
9. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- All validation errors display correctly
- Submit is prevented when validation fails
- Test cleans up after itself

---

### Task 6.12: Write E2E test for empty state
- [ ] **Description**: Test the empty state display when no members.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with only current user
2. Navigate to `/app/family`
3. Verify empty state card is displayed
4. Verify message "No family members yet" appears
5. Verify description "Click 'Add Member' to get started" appears for parent
6. Clean up test data

**Acceptance Criteria**:
- Test passes consistently
- Empty state displays correctly
- Test cleans up after itself

---

### Task 6.13: Write E2E test for responsive layouts
- [ ] **Description**: Test that the grid layout adapts to different viewport sizes.

**Files to modify**:
- `apps/web/tests/e2e/app/family.spec.ts`

**Steps**:
1. Set up test: Create parent user and family with 6 members
2. Test mobile (375px width):
   - Navigate to `/app/family`
   - Verify 1-column grid
   - Verify mobile "+" button visible
   - Click "+" and verify add member dialog opens
3. Test tablet (768px width):
   - Resize viewport
   - Verify 2-column grid
4. Test desktop (1280px width):
   - Resize viewport
   - Verify 3-column grid
   - Verify "Add Member" button visible in page header
5. Clean up test data

**Acceptance Criteria**:
- Test passes consistently on all viewport sizes
- Grid columns adjust correctly
- Mobile and desktop buttons work correctly
- Test cleans up after itself

---

## Phase 7: Final Integration & Validation

### Task 7.1: Manual testing of complete workflow
- [ ] **Description**: Perform manual QA of the entire family page feature.

**Steps**:
1. Log in as parent user
2. Navigate to `/app/family`
3. Verify all members display correctly
4. Test updating a member's role
5. Test removing a member
6. Test last parent protection
7. Test granting positive karma
8. Test deducting karma
9. Test adding a new member
10. Test all validation errors
11. Switch to Dutch language and verify all text translates
12. Log in as child user and verify actions are hidden
13. Test on mobile, tablet, and desktop viewports

**Acceptance Criteria**:
- All features work as expected
- No console errors
- UI is responsive and polished
- Translations are correct
- Authorization works correctly

---

### Task 7.2: Run all unit tests
- [ ] **Description**: Verify all unit tests pass.

**Steps**:
1. Run `pnpm test:unit` in the web app
2. Verify all family slice tests pass
3. Verify all utility function tests pass
4. Fix any failing tests

**Acceptance Criteria**:
- All unit tests pass with 100% success rate
- No test warnings or errors
- Tests run in reasonable time

---

### Task 7.3: Run all E2E tests
- [ ] **Description**: Verify all E2E tests pass.

**Steps**:
1. Run `pnpm test:e2e:web` to execute Playwright tests
2. Verify all family page E2E tests pass
3. Fix any flaky or failing tests
4. Run tests multiple times to ensure stability

**Acceptance Criteria**:
- All E2E tests pass consistently
- No flaky tests
- Tests clean up data properly
- Tests run in reasonable time

---

### Task 7.4: Code review and refinement
- [ ] **Description**: Review all code for quality, consistency, and best practices.

**Steps**:
1. Review all new files for code style consistency
2. Ensure all TypeScript types are properly defined
3. Verify all components follow design system patterns
4. Check for any hardcoded strings (should use dict)
5. Verify error handling is consistent
6. Check for any console.log statements (remove or use proper logging)
7. Verify accessibility (keyboard navigation, ARIA labels, etc.)
8. Run Biome linter and fix any issues
9. Ensure all imports are organized and unused imports removed
10. Verify no duplicate code

**Acceptance Criteria**:
- Code passes Biome linter with no errors
- Code follows project conventions
- No hardcoded strings
- Accessibility guidelines followed
- Code is clean and maintainable

---

## Summary

**Total Tasks**: 39 tasks organized in 7 phases

**Estimated Effort**:
- Phase 1 (API Client): 2-3 hours
- Phase 2 (Redux Slice): 4-5 hours
- Phase 3 (Unit Tests): 4-5 hours
- Phase 4 (UI Components): 8-10 hours
- Phase 5 (i18n): 1-2 hours
- Phase 6 (E2E Tests): 6-8 hours
- Phase 7 (Integration): 2-3 hours

**Total**: ~27-36 hours

**Parallelization Opportunities**:
- Phase 1 and Phase 2 can be done in parallel (separate developers)
- Phase 4 components can be built in parallel after Phase 2 is complete
- Phase 5 (i18n) can be done in parallel with Phase 4
- Phase 6 E2E tests can be written in parallel for different features

**Critical Path**:
- Phase 1 → Phase 2 → Phase 4 → Phase 6 → Phase 7
- Phase 3 and Phase 5 are parallel to critical path

**Success Metrics**:
- All unit tests pass (target: 100% success)
- All E2E tests pass (target: 100% success)
- No console errors in manual testing
- All features work as specified
- Code passes linter
- Translations are complete and accurate
