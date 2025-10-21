# Data Model - Remove Family Members

## Existing Entity: FamilyMembership (no schema changes)
- **_id**: ObjectId - unique membership identifier.
- **familyId**: ObjectId - references the family document.
- **userId**: ObjectId - references the user associated with the family.
- **role**: Enum (`Parent`, `Child`) - determines access level.
- **addedBy**: ObjectId (optional) - parent who linked the member.
- **createdAt / updatedAt**: Date - maintained by repository.

**Rules & Relationships**
- `(familyId, userId)` uniqueness enforced by `idx_family_user_unique`; deletion frees the slot for future re-joins.
- Parent removals MUST ensure another `Parent` membership remains before deletion proceeds.
- Removal operations delete the membership document identified by `(familyId, userId)`; the underlying user account remains untouched for future family invitations.

## Derived View: FamiliesWithMembersResponse (behavior note)
- On successful removal, `members` array returned by `/v1/families` MUST exclude the unlinked member because their membership record is deleted prior to response refresh.
- Any cached or in-flight references MUST rely on fresh fetches to reflect updated roster state.
