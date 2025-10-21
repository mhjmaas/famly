# Research: Add Family Members

## Decision: Performance Goals – p95 under 300 ms for membership creation
- **Rationale**: Creating a family member involves one user creation call and one MongoDB insert; similar existing endpoints (family create/list) complete well under 300 ms in local testing. Maintaining a sub-300 ms p95 keeps the experience responsive even when invoked from the web UI while allowing for network variability.
- **Alternatives considered**: 200 ms p95 (too aggressive once external auth service latency is included); no formal target (risks regressions going unnoticed).

## Decision: Constraints – single request, atomic outcome using existing better-auth hashing
- **Rationale**: Parent-triggered member creation must succeed or fail as a unit. Delegating password storage to better-auth ensures hashing/validation is centralized and prevents password handling in our code. Reusing the existing unique index on `(familyId, userId)` keeps duplication checks consistent.
- **Alternatives considered**: Manual password hashing with direct Mongo writes (would duplicate auth logic and violate DRY); multi-step flow with provisional users (adds complexity without clear benefit).

## Decision: Scale/Scope – support at least 25 active members per family, 5 create ops/min
- **Rationale**: Specification states “no limits” on family members. Planning for ≥25 concurrent members per family covers typical multi-parent households plus extended caregivers, while 5 creation operations per minute per family covers bulk onboarding without taxing Mongo or auth services. The existing indexes can handle this load without modification.
- **Alternatives considered**: Unlimited documented capacity (difficult to validate or test meaningfully); fixed small cap (would contradict specification’s “no limits” intent).

## Decision: Member provisioning – call `auth.api.signUpEmail` and discard tokens
- **Rationale**: better-auth already provisions users with validated email/password and hashing. Invoking `signUpEmail` programmatically allows reuse of validation while ignoring returned session/token data, thus avoiding immediate login. We simply avoid copying `set-cookie`, JWT, or session tokens into the response.
- **Alternatives considered**: Direct database insert via Mongo (would bypass better-auth validation and compromise security); toggling global `autoSignIn` to false (impacts standard self-signup flow); waiting for a dedicated admin endpoint (not currently available).

## Decision: Role guard pattern – higher-order checker usable as middleware or inline util
- **Rationale**: Implementing `requireFamilyRole({ familyIdParam, allowedRoles })` as a composable helper keeps Express middleware thin while allowing services to call a pure function during non-HTTP workflows. The helper inspects `req.user.families` hydrated by `authenticate` and falls back to repository lookup when absent, satisfying SOLID and DRY.
- **Alternatives considered**: Hardcoding role checks per route (duplicates logic, fragile if roles expand); embedding guard only in middleware form (less flexible for service-level enforcement).
