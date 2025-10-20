# Phase 0 Research

## better-auth integration for Express
- Decision: Instantiate a single `better-auth` core instance and expose it through the provided Express middleware to populate `req.auth` handlers for register, login, and session validation flows.  
- Rationale: The library ships with an adapter that hooks into Express's request lifecycle, giving us typed helpers (`auth.handleEmailPasswordSignIn`, `auth.createSession`, etc.) while keeping controllers thin and SOLID-compliant. Centralizing the instance also lets us share configuration (hashing, session TTLs) across endpoints.  
- Alternatives considered: Manually calling `better-auth` helpers inside each route (tighter coupling, harder to swap frameworks later); adopting Passport.js or Lucia (diverges from stakeholder request, more boilerplate to mirror better-auth feature set).

## Database layer selection
- Decision: Use the official `mongodb` Node.js driver in a lightweight repository wrapper instead of an ODM.  
- Rationale: better-auth's Mongo adapter works directly with the native driver, which keeps the dependency surface small and avoids ODM abstractions we do not yet need. A thin repository keeps SOLID boundaries while letting us enforce unique indexes and validation at the database level.  
- Alternatives considered: Mongoose (adds schema layer but increases coupling and migration overhead); Prisma (excellent DX but brings additional schema tooling and engines that are unnecessary for a single Mongo service).

## MongoDB deployment & connection strategy
- Decision: Introduce a root-level `docker/compose.dev.yml` defining `api` and `mongo` services, with the API consuming an internal `MONGODB_URI` that targets a named replica-set-enabled container volume.  
- Rationale: Docker Compose keeps local onboarding simple, mirrors future CI workflows, and lets us bind port 27017 only when needed. Enabling a single-node replica set prepares us for transactions and TTL indexes required by better-auth session storage without meaningful overhead.  
- Alternatives considered: Running MongoDB manually on the host (inconsistent across environments, harder to automate); using Docker just for Mongo while running the API on the host (breaks parity and complicates networking setup).

## HTTP integration testing tooling
- Decision: Add `supertest` for black-box testing of the Express app alongside Jest.  
- Rationale: supertest is the de facto choice for Express integration, works with Jest out of the box, and allows us to assert headers, cookies, and JSON payloads produced by better-auth flows. It also supports async lifecycle hooks that pair well with a test Mongo instance.  
- Alternatives considered: Using raw `fetch`/`node:test` (more boilerplate to bootstrap server and handle teardown); relying solely on unit tests (misses contract regressions across register/login/current user endpoints).

## Session persistence model
- Decision: Store session documents in a dedicated `sessions` collection managed by better-auth with a TTL index, issuing httpOnly secure cookies that carry opaque session IDs referencing Mongo state.  
- Rationale: Server-managed sessions align with better-auth defaults, simplify token revocation, and let us enforce expirations centrally. Using cookies avoids exposing raw JWTs, keeps clients lightweight, and meets the requirement to block unauthenticated requests.  
- Alternatives considered: Stateless JWT access tokens (harder to revoke, requires additional signing key rotation) and storing sessions in-memory (fails horizontal scaling, loses persistence across restarts).

## Concurrency baseline
- Decision: Target 100 concurrent authenticated sessions and 50 concurrent registration attempts as the initial load envelope.  
- Rationale: This range comfortably covers the MVP goal (~1k early users) with room for marketing spikes while keeping infrastructure modest. It informs connection pool sizing and index choices without over-optimizing prematurely.  
- Alternatives considered: Designing for <20 concurrent users (risks throttling real usage) or optimizing for 1k+ concurrent sessions now (would demand sharding/cluster strategy we do not yet need).
