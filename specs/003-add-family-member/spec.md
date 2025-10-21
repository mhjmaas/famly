# Feature Specification: Add Family Members

**Feature Branch**: `[003-add-family-member]`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "I now want to be able to add family members, only when my role is a parent. The member to be added can be parent or child. Once again we only need an email address and a password. However it is important when this new member/user is created we should not immediately log this user in as opposed to when signing up from scratch. There are no limits as to how many members a family can have, in the same sense we can also have multiple parent roles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parent adds a child (Priority: P1)

A parent who manages an existing family wants to add a child so everyone shares the same account space.

**Why this priority**: Enables core value of building multi-member families, unlocking the main reason for the feature request.

**Independent Test**: Can be fully tested by attempting to add a child from a parent account and confirming the child is linked to the family without logging in automatically.

**Acceptance Scenarios**:

1. **Given** a logged-in parent is viewing family management, **When** they submit a new member with role "Child" plus email and password, **Then** a new user is created, linked to the same family, a confirmation is shown to the parent, and the child is not logged in automatically.
2. **Given** the parent adds the same child details again, **When** they submit the form, **Then** the system blocks the duplicate and explains the email is already used for this family.

---

### User Story 2 - Parent adds a co-parent (Priority: P2)

A parent needs to add another adult caregiver so responsibilities can be shared.

**Why this priority**: Supports collaborative caregiving while leveraging the same flow as adding children.

**Independent Test**: Add a new member with role "Parent" and verify they receive the same family access without being logged in on creation.

**Acceptance Scenarios**:

1. **Given** a logged-in parent, **When** they add a new member with role "Parent" using email and password, **Then** the new parent account is created, linked to the family, and no new session is started for the added parent.
2. **Given** the parent adds a co-parent using an email already associated with another family, **When** the form is submitted, **Then** the parent is informed the email cannot be reused and is prompted to choose a different email.

---

### User Story 3 - Non-parent is prevented from adding members (Priority: P3)

A family member who is not a parent attempts to add someone new but should not have that control.

**Why this priority**: Protects family membership integrity and respects role-based permissions.

**Independent Test**: Log in as a non-parent family member and confirm there is no path to create additional members.

**Acceptance Scenarios**:

1. **Given** a logged-in member with a non-parent role, **When** they try to access the add member option, **Then** the option is unavailable or blocked with an explanatory message.

---

### User Story 4 - Parent reviews current memberships (Priority: P2)

A parent wants to confirm who currently belongs to the family and the roles assigned to each member.

**Why this priority**: Parents need visibility into the household roster to manage permissions and ensure everyone expected has access.

**Independent Test**: Fetch `/v1/families` for a logged-in parent and confirm each family entry includes a `members` array with membership details for every linked user.

**Acceptance Scenarios**:

1. **Given** a logged-in parent with at least one family membership, **When** they call `GET /v1/families`, **Then** each returned family includes a `members` array containing all linked users with their roles and linkage timestamps.
2. **Given** a logged-in parent with multiple families, **When** they call `GET /v1/families`, **Then** every family in the response exposes its respective `members` list without leaking memberships from other families.

---

### Edge Cases

- Parent attempts to add a member when their family already has a large number of members; the flow must still succeed without imposed limits.
- Provided email address belongs to an existing account outside the family; system guides the parent to supply a different email.
- Password is missing or fails basic quality rules; parent is prompted to correct the input before creation proceeds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow authenticated users with the parent role to add a new family member by providing their email, password, and intended role.
- **FR-002**: System MUST restrict access to the add-member capability for any user who is not marked as a parent in the current family.
- **FR-003**: System MUST link the newly created member to the same family as the initiating parent while keeping other families unaffected.
- **FR-004**: System MUST support assigning either a parent or child role to the new member and store that designation for future permissions.
- **FR-005**: System MUST return a confirmation to the initiating parent without starting an authenticated session for the newly created member.
- **FR-006**: System MUST prevent creating a new family member with an email that already belongs to the same family and provide guidance to the parent.
- **FR-007**: System MUST prevent using an email that is already associated with a different family account and inform the parent that a unique email is required.
- **FR-008**: System MUST record the timestamp and initiating parent for each member addition so admins can audit membership changes.
- **FR-009**: System MUST extend the `GET /v1/families` endpoint to include a `members` array for each family, detailing every linked user's identifier, role, linkage timestamp, and the initiating parent when available.

### Key Entities *(include if feature involves data)*

- **Family**: Represents a household unit; holds identifying details and the list of members attached to it.
- **Family Member**: Represents an individual account within a family; stores email, role (parent or child), status, and association to exactly one family.
- **Membership Activity**: Captures events where members are added, providing actor (initiating parent), target member, and timestamp for compliance tracking.

## Assumptions

- Parents collect initial passwords from new members and communicate them securely outside the system.
- Existing users cannot currently belong to multiple families; attempting to reuse their email requires creating a new, unique account.
- Email verification for the newly added member follows the same policies already in place for standard sign-ups.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of parents in usability testing can add a new family member successfully on their first attempt without staff assistance.
- **SC-002**: 100% of attempts by non-parent roles to access or execute the add-member flow are blocked or redirected without modifying family membership.
- **SC-003**: Parents report clear feedback messages for duplicate or ineligible emails in at least 90% of moderated test sessions.
- **SC-004**: Families that add new members complete the process in under 2 minutes from opening the add-member flow to confirmation in at least 85% of observed sessions.
- **SC-005**: 95% of surveyed parents can locate and validate their current family roster via `GET /v1/families` without support, confirming each member entry includes role and linkage metadata.
