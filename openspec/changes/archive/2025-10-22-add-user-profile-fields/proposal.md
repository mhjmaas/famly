## Why
- Families need consistent profile details so parents can recognize members and tailor experiences, but users created today only capture email/password.
- Birthdate is required for age-based experiences (parental controls, allowance rules) yet is missing across registration and team-member onboarding.
- `/v1/auth/me` and family listings must expose the same fields clients capture to avoid extra lookups or mismatched UI.

## What Changes
- Require `name` and `birthdate` in the registration flow and persist them on the user profile.
- Extend the parent "add family member" flow to collect and validate the same fields before creating a linked account.
- Update `/v1/auth/me` and family listing responses so every returned user/member includes `name` and `birthdate` (or `null` when legacy data lacks them).
- Refresh validators, DTOs, and automated tests to cover the new input and response contracts.

## Impact
- No production compatibility work is required—we will clear the development database before landing this change, so only fresh records exist.
- API consumers must update payloads for registration and member creation and adjust response parsing to handle the new fields.
- Test suites and fixtures will require updates; ensure CI remains green before merging.
