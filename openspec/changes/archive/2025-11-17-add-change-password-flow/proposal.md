## Why
- Users cannot currently rotate their passwords after signup, which blocks basic account hygiene and compliance asks for hosted tenants.
- Better Auth already exposes a `changePassword` API for authenticated sessions; wiring it into our Express layer keeps server logic consistent with register/login while letting us enforce validation and audit logging.
- The profile UI only offers "Edit Profile" and "Logout", so there is no obvious entry point for updating credentials or guiding the user through the forced re-authentication.

## What Changes
- Add an authenticated `POST /v1/auth/change-password` endpoint that validates `{ currentPassword, newPassword, revokeOtherSessions }`, immediately delegates to `auth.api.changePassword` (Better Auth performs the old-password check), and propagates Better Auth errors (invalid current password, policy violations) with clear HTTP codes.
- Force `revokeOtherSessions=true` for now so that password changes invalidate every token, and expire the caller's session cookie/JWT so clients must sign in again.
- Extend the profile card dropdown with a localized "Change Password" action that opens a dialog (desktop) / drawer (mobile) asking for current + new password and confirm, blocks submission until validation passes, and shows inline success/error states.
- After a successful change the UI calls the logout flow automatically, shows a toast/banner explaining that the password was updated, and routes the user to `/{lang}/signin` to log back in.
- Add translation strings for menu labels, dialog copy, form fields, error text, and the forced logout confirmation in both `en-US` and `nl-NL` dictionaries.
- Cover the end-to-end UX with a Playwright scenario (authenticated change + fresh login) instead of component tests, and extend the backend e2e suite to exercise the new API.

## Impact
- Mobile or other API consumers can adopt the same endpoint without new auth scopes; unauthenticated password reset flows remain out of scope.
- Any active sessions are revoked immediately, so QA needs to expect sign-outs after exercising the flow.
- Requires new e2e coverage for the API route plus React component tests (or Playwright coverage) to ensure the dialog/drawer renders and logs out after success.
