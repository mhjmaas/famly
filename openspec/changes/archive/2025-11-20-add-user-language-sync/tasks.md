# Add User Language Sync - Implementation Tasks

Ordered list with validation for each step.

1) Auth schema & session plumbing  
- [x] Add `language` to Better Auth `additionalFields` with enum (`en-US`/`nl-NL`) and default.  
- [x] Extend `customSession` hydration to include `language`.  
- [x] Add unit/integration coverage for session payload including `language`.

2) API contract updates (register/login/me)  
- [x] Update register/login validators to accept optional `language` constrained to supported locales and default when missing.  
- [x] Include `language` in `/v1/auth/login` and `/v1/auth/register` responses (user payload) and `/v1/auth/me`.  
- [x] Add e2e tests asserting response shape and DB persistence on register/login.

3) Profile update path  
- [x] Extend `PATCH /v1/auth/me` schema to accept `language`.  
- [x] Persist `language` to the Better Auth user document and return it.  
- [x] Add e2e test: change language, verify persisted value in subsequent `/me`.

4) Web client plumbing  
- [x] Update API client types/interfaces to include `language` on user/profile shapes.  
- [x] Wire language selector for authenticated users to call the profile update endpoint and refresh local state.  
- [x] Add unit/RTL test for selector dispatch and server update call.

5) Locale source of truth on web entry  
- [x] On authenticated entry/middleware, prefer stored `user.language` over `Accept-Language` when choosing locale/redirects.  
- [x] When stored language differs from active route locale, sync it via the profile update flow.  
- [x] Add integration/e2e coverage: returning user on new device is redirected/rendered in stored language.

6) Documentation & validation  
- [x] Update relevant README or developer notes if any mention user profile fields.  
- [x] Run `openspec validate add-user-language-sync --strict` and keep all tests/lint green.  
- [x] Run lint & build (API) locally; web build blocked by offline font fetch (expected in sandbox).
