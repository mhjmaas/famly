# Proposal: implement-family-page

## Change ID
`implement-family-page`

## Summary
Implement a fully functional family members page in the web application that allows parents to view, manage, edit roles, remove members, give karma, and add new family members. The implementation will follow the reference design pattern while integrating with existing backend APIs and Redux state management.

## Motivation
Currently, the family page (`/app/family`) displays only a placeholder message. Users need a complete interface to manage their family members, including:
- Viewing all family members with their details (name, age, role, karma)
- Editing member roles (Parent/Child) for administrative changes
- Removing members from the family when needed
- Granting or deducting karma to/from members with explanatory messages
- Adding new members to the family with required profile information

The existing backend APIs already support all these operations, so this change focuses on building the frontend experience that connects to those endpoints.

## Scope

### In Scope
1. **Family Members Display Component**
   - Grid layout showing all family members as cards
   - Display member avatar (with initials), name, age calculation, role badge, and karma count
   - Responsive design (mobile, tablet, desktop)
   - Empty state when no members exist

2. **Edit Member Role Dialog**
   - Dialog for updating a member's role between Parent and Child
   - Role selection via Select component (shadcn/ui)
   - Parent-only authorization check
   - Error handling and success feedback

3. **Remove Member Confirmation**
   - AlertDialog (shadcn/ui) for confirming member removal
   - Parent-only authorization check
   - Prevent removing the last parent
   - Error handling and success feedback

4. **Give Karma Dialog**
   - Dialog for granting positive or negative karma
   - Amount input (number) with validation
   - Message/description input (required, max 500 chars)
   - Radio buttons for positive/negative karma type
   - Parent-only authorization check
   - Error handling and success feedback

5. **Add Member Dialog**
   - Dialog for adding new family members
   - Form fields: name (required), birthdate (required, date picker), role (required, Parent/Child)
   - Form validation matching backend requirements
   - Parent-only authorization check
   - Error handling and success feedback

6. **Redux State Management**
   - New `family.slice.ts` for family state
   - Async thunks for API operations (fetch families, update role, remove member, grant karma, add member)
   - Selectors for accessing family data
   - Loading and error states
   - Unit tests for all slice logic

7. **API Client Extensions**
   - Type-safe API functions for all family operations
   - Proper error handling and response typing

8. **E2E Tests**
   - Test family members display and data loading
   - Test role editing workflow (success and error cases)
   - Test member removal workflow (success, confirmation, and error cases)
   - Test karma granting workflow (positive and negative amounts)
   - Test add member workflow (success and validation errors)
   - Test authorization (child users cannot access parent-only actions)

9. **Internationalization**
   - Add dictionary entries for all UI text in English and Dutch
   - Labels, buttons, dialog titles, error messages, placeholders

### Out of Scope
- Location fields for members (backend doesn't support it yet)
- Editing member name or birthdate (specified as out of scope)
- Member profile photos/avatars (will use initials only)
- Bulk operations (select multiple members)
- Member activity history or detailed stats
- Email invitations for new members
- Password setup flow for new members (assumes backend handles this)

## Dependencies
- Existing backend API endpoints:
  - `GET /v1/families` - List families with members
  - `PATCH /v1/families/{familyId}/members/{memberId}` - Update member role
  - `DELETE /v1/families/{familyId}/members/{memberId}` - Remove member
  - `POST /v1/families/{familyId}/karma/grant` - Grant/deduct karma
  - `POST /v1/families/{familyId}/members` - Add member

- Existing Redux infrastructure (`store`, `hooks`, `provider`)
- Existing shadcn/ui components (Dialog, AlertDialog, Button, Input, Select, Label, Card, Avatar, Badge, etc.)
- Existing API client infrastructure (`api-client.ts`)
- Existing i18n infrastructure (`dictionaries`, `getDictionary`)

## Success Criteria
1. Parents can view all family members in an intuitive card layout
2. Parents can update any member's role with immediate feedback
3. Parents can remove members with confirmation, preventing accidental deletions
4. Parents can grant or deduct karma with required messages
5. Parents can add new members with proper validation
6. Child users see family members but cannot perform administrative actions
7. All operations handle errors gracefully with user-friendly messages
8. All features are covered by E2E tests
9. All Redux logic is covered by unit tests
10. The UI matches the reference design and follows the design system
11. All text is internationalized in English and Dutch

## Risks and Mitigations
- **Risk**: Complex Redux state management could lead to race conditions
  - **Mitigation**: Use Redux Toolkit's built-in async thunk patterns with proper loading states

- **Risk**: Authorization checks could be inconsistent between frontend and backend
  - **Mitigation**: Always rely on backend authorization, use frontend checks only for UX (hiding buttons)

- **Risk**: Form validation mismatch between frontend and backend
  - **Mitigation**: Mirror backend Zod validators in frontend validation logic, reference API specs

- **Risk**: E2E tests could be flaky due to async state updates
  - **Mitigation**: Use Playwright's built-in waiting mechanisms and clear test data setup/teardown

## Related Changes
- Builds upon `web-dashboard` spec (navigation and layout)
- Depends on `family` spec (backend APIs)
- Depends on `karma` spec (karma grant API)
- Relates to `web-auth` spec (authentication context)
