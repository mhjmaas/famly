# Change: Production-Grade PWA Notifications

## Why
The current POC implements basic push notification functionality with in-memory storage, which is not production-ready. Users need a robust notification system to stay informed of family activities, task updates, and important events. The system must persist subscriptions in MongoDB, provide graceful UI prompts for permissions, support the "Add to Home Screen" workflow, and integrate seamlessly with the existing Redux architecture and translation system.

## What Changes
- Add MongoDB persistence for push notification subscriptions linked to users and devices
- Create API endpoints (`POST /v1/notifications/subscribe`, `DELETE /v1/notifications/unsubscribe`, `POST /v1/notifications/send`) with authentication and validation
- Implement Redux slice (`notifications.slice.ts`) to manage subscription state, permission status, and prompt visibility with 100% unit test coverage
- Add reusable notification permission drawer with translations explaining benefits and requesting user consent
- Add "Add to Home Screen" prompt drawer with platform-specific instructions (iOS vs Android/Desktop)
- Integrate notification checks into dashboard layout to prompt users who haven't subscribed
- Create notification service utility for sending notifications from backend when events occur (task completion, karma grants, etc.)
- Add E2E tests with Page Object pattern covering subscription flow, permission prompts, and notification delivery
- Support full internationalization with en-US and nl-NL translations

## Impact
- Affected specs: NEW `pwa-notifications`, NEW `pwa-install`, NEW `web-pwa`
- Affected code:
  - API: `src/modules/notifications/` (new module with routes, validators, services, repositories)
  - Web: `src/store/slices/notifications.slice.ts` (new Redux slice)
  - Web: `src/components/pwa/` (new drawer components)
  - Web: `src/lib/pwa/` (new utilities for service worker, subscription management)
  - Web: `src/dictionaries/*.json` (translation keys)
  - Database: `famly.push_subscriptions` collection (new)
  - Tests: E2E and unit test coverage across all new functionality
