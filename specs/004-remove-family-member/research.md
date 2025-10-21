# Research Log: Remove Family Members

## Decision 1: REST endpoint shape for unlinking members
- **Decision**: Use `DELETE /v1/families/:familyId/members/:memberId` to remove a member by their user ID within the specified family.
- **Rationale**: Aligns with existing `/v1/families/:familyId/members` resource hierarchy, provides idempotent semantics, and fits Express routing conventions already in the repo.
- **Alternatives Considered**:
  - `POST /.../members/remove` with action payload (rejected: non-RESTful, risks extra validator surface).
  - `DELETE /v1/families/:familyId/members/:membershipId` using membership document ID (rejected: membership IDs are not exposed in responses today, which would introduce new response fields solely for deletion).

## Decision 2: Guardrail against orphaned families
- **Decision**: Before deletion, query remaining memberships in the family and block removal if it would eliminate the final parent membership.
- **Rationale**: Fulfills spec requirement to keep at least one parent, leverages existing repository methods (`findByFamily`) without new projections, and keeps logic centralized in `FamilyService`.
- **Alternatives Considered**:
  - MongoDB transaction with aggregation pipeline to enforce parent count (rejected: unnecessary complexity for single-document deletion when simple pre-check suffices).
  - Denormalized parent counter on the family document (rejected: adds write contention and drift risk for minimal benefit).

## Decision 3: Storage strategy for removals
- **Decision**: Rely on deleting the existing family membership document; no additional audit collection or soft-delete markers are introduced.
- **Rationale**: Matches the request to keep the flow simple, avoids redundant data, and leverages the unique index to guarantee clean state for future re-joins.
- **Alternatives Considered**:
  - Dedicated removal audit collection (rejected: over-engineered for current requirements).
  - Soft-delete flags on membership records (rejected: adds complexity to queries and index enforcement without tangible benefit).
