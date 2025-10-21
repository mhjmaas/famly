# Data Model - Remove Family Members

## Existing Entity: FamilyMembership (no schema changes)
- **_id**: ObjectId - unique membership identifier.
- **familyId**: ObjectId - references the family document.
- **userId**: ObjectId - references the user associated with the family.
- **role**: Enum (`Parent`, `Child`) - determines access level.
- **addedBy**: ObjectId (optional) - parent who linked the member.
- **createdAt / updatedAt**: Date - maintained by repository.

**Rules & Relationships**
- `(familyId, userId)` uniqueness enforced by `idx_family_user_unique`; deletion must free the slot for future re-joins.
- Parent removals MUST ensure another `Parent` membership remains before deletion proceeds.
- Removal operations target the membership identified by `(familyId, userId)`; the user account persists outside the membership table.

## New Entity: FamilyMembershipRemoval
- **_id**: ObjectId - audit record identifier.
- **familyId**: ObjectId - family from which the member was removed.
- **userId**: ObjectId - removed member account.
- **removedBy**: ObjectId - parent who initiated the unlink action.
- **removedAt**: Date - timestamp recorded at removal commit.

**Rules & Relationships**
- `removedBy` MUST reference a user who held `Parent` role in the family at removal time.
- Records are append-only; there is no update path.
- Indexes: compound `{ familyId: 1, removedAt: -1 }` for support queries and `{ userId: 1, removedAt: -1 }` for tracing a user's history.
- Removal events are created within the same service transaction window as the membership deletion to keep audit logs consistent.

## Derived View: FamiliesWithMembersResponse (behavior note)
- On successful removal, `members` array returned by `/v1/families` MUST exclude the unlinked member because their membership record is deleted prior to response refresh.
- Any cached or in-flight references MUST rely on fresh fetches to reflect updated roster state.
