# Data Model – Add Family Members

## Updated Entity: FamilyMembership
- **_id**: ObjectId – unique membership identifier.
- **familyId**: ObjectId – references the family document.
- **userId**: ObjectId – references the user document created via better-auth.
- **role**: Enum (`Parent`, `Child`) – determines authorization scope.
- **createdAt / updatedAt**: Date – timestamps maintained by repository.
- **addedBy**: ObjectId – *new* field capturing the initiating parent; defaults to `userId` when historical records lack the field.

**Relationships & Rules**
- `(familyId, userId)` remains unique (enforced by existing index).
- `addedBy` MUST resolve to a user who holds `Parent` role within the same family.
- New memberships inherit `familyId` from the parent initiating the request.

## New Value Object: AddFamilyMemberRequest
- **email**: string – required, normalized lowercase; must be unique across all users.
- **password**: string – required, minimum 8 characters, delegated to better-auth validation.
- **role**: Enum (`Parent`, `Child`) – required, determines permissions granted at creation.

**Validation Rules**
- Reject if email already mapped to any family membership (conflict).
- Reject if role is not supported (`Parent` or `Child`).
- Password quality errors bubble up from better-auth.

## New Value Object: AddFamilyMemberResult
- **memberId**: string – the created user’s identifier.
- **familyId**: string – family receiving the new member.
- **role**: Enum (`Parent`, `Child`).
- **linkedAt**: ISO string – timestamp of membership creation.
- **addedBy**: string – parent user ID responsible for creation (matches `addedBy`).

**Usage**
- Returned to the initiating parent.
- Serves as audit payload for logs and downstream notifications.
