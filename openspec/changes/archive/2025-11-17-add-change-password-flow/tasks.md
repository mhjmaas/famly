## 1. API: Auth module

### 1.1 Endpoint + validation
- [x] 1.1.1 Add a Zod schema (e.g., `changePasswordSchema`) that enforces `currentPassword` and `newPassword` (min 8 chars, no reuse) plus optional `revokeOtherSessions` defaulting to `true`.
- [x] 1.1.2 Implement `apps/api/src/modules/auth/routes/change-password.route.ts` that mounts `POST /change-password`, runs `authenticate`, validates the body, calls `auth.api.changePassword` without attempting to verify the old password itself (Better Auth handles that), and responds with 204 on success.
- [x] 1.1.3 Update `createAuthRouter` to register the new route before the Better Auth catch-all.

### 1.2 Session + error handling
- [x] 1.2.1 Ensure the route copies `set-cookie` headers from Better Auth so the session cookie is cleared when the password rotates.
- [x] 1.2.2 Map Better Auth failures to `400` (validation), `401` (invalid current password / session missing), and `500` (unexpected) with consistent JSON error payloads.

### 1.3 Tests
- [x] 1.3.1 Add unit tests for the validator edge cases (too-short password, missing current password).
- [x] 1.3.2 Extend the existing backend e2e auth suite to cover `/v1/auth/change-password`, verifying success (204 + revoked session) and failure when the current password is wrong before allowing any follow-up requests.

## 2. Web: Profile experience

### 2.1 Translations + API client
- [x] 2.1.1 Extend `en-US.json` and `nl-NL.json` with menu labels, dialog copy, validation errors, and success/logout messaging for the change-password flow.
- [x] 2.1.2 Add an API client helper (e.g., `changePassword`) that calls the new endpoint with session cookies; export typing for reuse.

### 2.2 UI flow
- [x] 2.2.1 Update `UserProfileCard` (and any parent wiring) to pass the new dictionary strings and insert a "Change Password" dropdown item.
- [x] 2.2.2 Build a shared form component (dialog on desktop, drawer on mobile) collecting `current`, `new`, `confirm` passwords, with validation + disable rules, loading states, and inline error text sourced from translations.
- [x] 2.2.3 On success, show a transient success state, call the existing `logout` helper, clear Redux user state, and redirect to `/{lang}/signin`.

### 2.3 Tests
- [x] 2.3.1 Add a Playwright e2e scenario where an authenticated user opens the profile menu, changes their password via the dialog/drawer, gets logged out, and can sign in again with the new password (no component tests required).

## 3. Documentation & Verification
- [x] 3.1 Update README/API docs if they mention available auth endpoints to include `/v1/auth/change-password` and its requirements.
- [x] 3.2 Run `pnpm test && pnpm run lint` at repo root (or scoped equivalents) to verify everything, documenting any follow-up work if suites are flaky.
