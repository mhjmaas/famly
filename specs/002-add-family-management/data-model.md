# Data Model: Family Management

## Collections

### `families`
- **_id**: ObjectId (primary key)
- **name**: string | null (optional display name; trimmed; max 120 chars)
- **creatorId**: ObjectId (references `auth.users._id`)
- **createdAt**: Date (server timestamp)
- **updatedAt**: Date (server timestamp updated on name changes)

**Indexes**
- `{ creatorId: 1 }` to support listing families created by a user.
- `{ name: 1 }` (non-unique) to enable case-insensitive search later; stored as normalized lowercase copy if required by future features (not enforced in this iteration).

### `family_memberships`
- **_id**: ObjectId (primary key)
- **familyId**: ObjectId (references `families._id`)
- **userId**: ObjectId (references `auth.users._id`)
- **role**: 'Parent' | 'Child'
- **createdAt**: Date (server timestamp when membership created)
- **updatedAt**: Date (server timestamp when role changes; unchanged in this iteration)

**Indexes & Constraints**
- Unique compound index on `{ familyId: 1, userId: 1 }` to enforce single membership per user per family.
- Index on `{ userId: 1 }` to enable efficient lookups for `/v1/families` list and JWT enrichment.

## Relationships
- One `family` has many `family_memberships`.
- Each `family_membership` references exactly one user and one family; users may appear in multiple families but only once per family.

## Derived DTOs
- **FamilyMembershipView** (used in JWT claim, `/v1/families` list, `/v1/auth/me`):
  ```json
  {
    "familyId": "string",     // hex ObjectId
    "name": "string | null",
    "role": "Parent" | "Child",
    "linkedAt": "ISO string"  // membership createdAt
  }
  ```
- **CreateFamilyInput**:
  ```json
  {
    "name": "string | null"   // optional; validates length <= 120, trims whitespace
  }
  ```

## State Transitions
- **Family Creation**: insert into `families`; immediately insert corresponding `family_memberships` record with role=`Parent` for creator.
- **Membership Role Change**: Out of scope for this iteration; reserved for future updates.

## Data Volume & Retention
- Expect low initial volume (<10 families per user); design supports growth by indexing lookups.
- Data retention follows existing MongoDB backup/retention policies; no additional TTL indexes required.
