# Add User Language Sync

## Status
PROPOSED

## Problem
The web UI already supports multiple languages, but language choice is only held in the URL/cookies and is not stored with the user. Better Auth owns the `user` collection, and we are not persisting the selected or detected locale there. As a result:
- Push and websocket notifications cannot pick the user's language.
- Returning users on new devices fall back to Accept-Language instead of their saved preference.
- `/v1/auth` responses do not surface a language field, so clients cannot synchronize consistently.

## Goal (narrow scope)
Persist the authenticated user's language preference in the database (Better Auth user record) and keep it in sync with the current locale used by the web app. This change must only cover preference storage/sync; **it must not add any notification translation logic**.

## Solution Outline
1. Extend the Better Auth user schema with a `language` field restricted to supported locales (`en-US`, `nl-NL`), defaulting to the detected or requested locale or the i18n default when missing.
2. Surface `language` on auth flows: registration/login responses, `/v1/auth/me`, and session payloads so both web and backend processes can read it.
3. Allow authenticated users to update their language preference (via existing profile update flow) and persist it to the Better Auth user document.
4. When an authenticated request has an active locale (URL or detected), ensure the app writes that locale to the stored `language` if it differs, so future requests, push, and websocket flows have the canonical value.

## In Scope
- Persisting `language` on the Better Auth user document and including it in auth/profile responses.
- Web client syncing the active locale to the backend for logged-in users (on register/login and when changing language in the UI).
- Using the stored language to select the locale for authenticated routes (instead of Accept-Language when a preference exists).

## Out of Scope
- Translating notification content or any other backend copy.
- Adding new notification types or delivery channels.
- Changing the set of supported locales.

## Dependencies / Investigations
- Better Auth supports `user.additionalFields`; current setup already adds `birthdate` and uses a `customSession` plugin to hydrate extra fields. We will extend this to include `language`.
- Web middleware (`apps/web/src/proxy.ts`) currently derives locale from `Accept-Language`; it will need to respect stored `user.language` once available.

## Success Criteria
- Auth API responses include a `language` field for authenticated users.
- Changing the language in the web UI updates the stored `user.language`.
- Authenticated users are routed/rendered using their stored language even on new devices.
- Scope stays limited to preference storage/sync; no notification translation changes are introduced.
