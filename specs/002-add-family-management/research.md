# Research: Family Management & JWT Enrichment

## Decision 1: Family Data Modeling in MongoDB
- **Decision**: Create two collections: `families` for family metadata (name, creator, timestamps) and `family_memberships` for user-to-family links with role and audit fields.
- **Rationale**: Separating families and memberships keeps the role constraint (one membership per user per family) enforceable via a compound unique index and lets us query memberships without loading entire family documents. This mirrors existing auth data separation (users vs sessions) and avoids array-update contention on a single document.
- **Alternatives Considered**:
  - **Embedded members array inside family**: rejected because enforcing uniqueness and querying by user requires $elemMatch scans and increases document contention as families grow.
  - **Single collection with denormalized family + membership**: rejected as it duplicates family metadata across memberships and complicates updates when the family name changes.

## Decision 2: Service Layer Pattern
- **Decision**: Introduce a `FamilyService` under `apps/api/src/modules/family` following the existing module structure (`routes`, `services`, `validators`) used by auth routes.
- **Rationale**: Reusing module structure keeps SOLID boundaries clear, aligns with current auth module layout, and allows dependency injection of repositories for testing. It also positions business logic outside Express handlers for better reusability.
- **Alternatives Considered**:
  - **Direct repository calls inside routes**: rejected because it would duplicate logic once other endpoints (e.g., invitations) are added, increasing coupling.
  - **Generic repository in shared lib**: deferred until additional domains need similar persistence logic.

## Decision 3: Enriching JWT and /me Payloads
- **Decision**: Extend the `betterAuthInit` JWT plugin configuration to include a custom claims callback that loads the requester's family memberships via the FamilyService when issuing tokens. Mirror the same enrichment inside `authenticate` to populate `req.user.families` so `/v1/auth/me` and other downstream consumers share a single source of truth.
- **Rationale**: Centralizing enrichment at token-issue time keeps JWTs stateless while guaranteeing `/me` responses echo the same structure. The service abstraction allows reuse between token creation and runtime authentication fallback (session lookups). This approach meets the requirement without adding libraries.
- **Alternatives Considered**:
  - **Post-process JWT response in login route**: rejected because other token issuance flows (refresh, register) would miss the enrichment unless duplicated.
  - **Store family IDs directly on the user record**: rejected because it couples membership state to user auth data and complicates multi-family membership updates.

## Decision 4: Testing Strategy
- **Decision**: Add unit tests for FamilyService (ensuring creation + role validation), integration tests for new `/v1/families` routes, and extend existing auth E2E specs to assert JWT payload and `/me` response include families.
- **Rationale**: Aligns with TDD and existing Jest test layout (unit under `tests/unit`, e2e under `tests/e2e`). Expanding the login/me end-to-end flows verifies the JWT enrichment contract without bespoke tooling.
- **Alternatives Considered**:
  - **Mock-heavy unit tests only**: rejected because it wouldn't validate the end-to-end JWT content requirement.
  - **Add new testing framework**: rejected to honor the constraint against new libraries.

## Decision 5: API Contract Shape
- **Decision**: Provide REST endpoints `/v1/families` (POST create, GET list) returning the canonical family membership view `{ familyId, name, role, createdAt }` consistent with the JWT claim structure.
- **Rationale**: Reusing the same DTO across routes, `/me`, and JWT claims minimizes duplication and ensures consumers receive consistent data. Follows existing `/v1/auth/*` REST pattern for coherence.
- **Alternatives Considered**:
  - **GraphQL or nested sub-resources**: rejected to avoid introducing new paradigms and stay consistent with current routing style.
