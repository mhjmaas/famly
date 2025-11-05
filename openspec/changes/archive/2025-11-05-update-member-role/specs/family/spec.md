# family Spec Delta

## ADDED Requirements

### Requirement: Parents can update member roles
Parents MUST be able to change any family member's role between Parent and Child after the member has been added to the family.

#### Scenario: Update member from Child to Parent
- **GIVEN** a parent authenticated with a family containing a Child member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "Parent" }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes the updated `memberId`, `familyId`, `role: "Parent"`, and `updatedAt` timestamp
- **AND** subsequent requests show the member as a Parent

#### Scenario: Update member from Parent to Child
- **GIVEN** a parent authenticated with a family containing another Parent member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "Child" }`
- **THEN** the API responds with HTTP 200
- **AND** the response includes the updated `memberId`, `familyId`, `role: "Child"`, and `updatedAt` timestamp
- **AND** subsequent requests show the member as a Child

#### Scenario: Update role rejects non-parent users
- **GIVEN** a Child member authenticated with a family
- **WHEN** the child calls `PATCH /v1/families/{familyId}/members/{memberId}` with any role
- **THEN** the API responds with HTTP 403
- **AND** the response includes an error message indicating insufficient permissions
- **AND** the target member's role remains unchanged

#### Scenario: Update role rejects invalid role values
- **GIVEN** a parent authenticated with a family containing a member
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{memberId}` with `{ "role": "InvalidRole" }`
- **THEN** the API responds with HTTP 400
- **AND** the response includes a validation error message
- **AND** the target member's role remains unchanged

#### Scenario: Update role rejects missing family
- **GIVEN** a parent authenticated user
- **WHEN** the parent calls `PATCH /v1/families/{nonExistentFamilyId}/members/{memberId}` with a valid role
- **THEN** the API responds with HTTP 404
- **AND** the response indicates the family was not found

#### Scenario: Update role rejects missing member
- **GIVEN** a parent authenticated with a family
- **WHEN** the parent calls `PATCH /v1/families/{familyId}/members/{nonExistentMemberId}` with a valid role
- **THEN** the API responds with HTTP 404
- **AND** the response indicates the member was not found

#### Scenario: Update role rejects member from different family
- **GIVEN** a parent authenticated with familyA
- **AND** a member who belongs to familyB but not familyA
- **WHEN** the parent calls `PATCH /v1/families/{familyA}/members/{memberIdFromFamilyB}` with a valid role
- **THEN** the API responds with HTTP 404 or HTTP 409
- **AND** the response indicates the member is not part of the specified family
- **AND** the member's role in familyB remains unchanged
