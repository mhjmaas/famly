# Change: Add localized push notifications

## Why
Backend notifications currently use hard-coded English strings, so users who set their language to another supported locale still receive English-only push notifications. We need to send push content in the user's preferred language to align with the web experience.

## What Changes
- Add notification localization that selects language from the stored user profile language (supported: en-US, nl-NL) with sensible fallback to default.
- Create backend-local notification dictionaries that mirror the frontend keys/shapes so push payload titles/bodies match web copy, without importing from the web app.
- Update notification templates and sending utilities to build payloads using localized strings and placeholders.
- Cover behavior with unit/e2e tests ensuring language selection, fallback, and per-user localization when sending to many recipients.

## Impact
- Affected specs: pwa-notifications
- Affected code: apps/api notifications module (templates, send utilities), user language lookup/helpers, backend dictionary assets (kept in api package)
