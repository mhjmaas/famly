# Design: Production-Grade PWA Notifications

## Context
The current POC uses in-memory storage for push subscriptions, which is lost on server restart and doesn't scale. We need a production-ready implementation that persists subscriptions in MongoDB, provides graceful UI flows for permission requests, and integrates with our existing authentication, Redux state management, and i18n systems.

**Key Constraints:**
- Must work with existing Better Auth JWT-based authentication
- Must integrate with Redux Toolkit state management patterns
- Must support en-US and nl-NL translations
- Must follow TDD approach with 100% unit test coverage for Redux slices
- Must use data-testid attributes and Page Object pattern for E2E tests
- Service worker registration must work with Next.js 16 app router

**Stakeholders:**
- End users who need timely notifications about family activities
- Developers maintaining API and web codebases
- QA/testers validating notification flows

## Goals / Non-Goals

**Goals:**
- Persist push subscriptions in MongoDB with user and device associations
- Provide clear, translated UI prompts for notification permissions
- Support "Add to Home Screen" prompts with platform-specific guidance
- Enable backend services to send notifications on events (tasks, karma, rewards)
- Maintain 100% unit test coverage for Redux slices
- Provide E2E test coverage for critical user flows

**Non-Goals:**
- Advanced notification scheduling or queuing (future enhancement)
- Notification preferences/filtering (future enhancement)
- Push notification analytics/tracking (future enhancement)
- Multi-tenant notification routing (single family context for MVP)

## Decisions

### Decision 1: MongoDB Schema for Subscriptions
**Choice:** Store subscriptions in a dedicated `push_subscriptions` collection with the following schema:
```typescript
{
  _id: ObjectId,
  userId: ObjectId,        // Link to user
  endpoint: string,        // Push subscription endpoint (unique per device/browser)
  keys: {
    p256dh: string,
    auth: string
  },
  deviceInfo: {
    userAgent: string,
    platform: string       // ios, android, desktop
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Rationale:**
- Separates concerns from user collection
- Allows multiple subscriptions per user (multiple devices)
- Easy to query and clean up stale subscriptions
- Index on `userId` for fast lookups
- Unique index on `endpoint` to prevent duplicates

**Alternatives considered:**
- Embedding subscriptions in user document → rejected due to array growth concerns and awkward queries
- Using a separate notifications database → rejected as overkill for MVP

### Decision 2: Redux Slice Design
**Choice:** Create `notifications.slice.ts` with the following state shape:
```typescript
{
  subscription: PushSubscription | null,     // Current browser subscription
  permissionStatus: 'default' | 'granted' | 'denied',
  isSubscribed: boolean,                      // Synced with backend
  showPermissionDrawer: boolean,
  showInstallDrawer: boolean,
  canInstall: boolean,                        // BeforeInstallPrompt available
  isLoading: boolean,
  error: string | null
}
```

**Rationale:**
- Tracks both browser permission state and backend subscription state
- Controls drawer visibility for prompts
- Supports install prompt capture (BeforeInstallPrompt event)
- Follows existing slice patterns in the codebase

**Alternatives considered:**
- Combining with settings slice → rejected to keep notifications isolated
- Using React context instead of Redux → rejected for consistency with project patterns

### Decision 3: API Endpoints Structure
**Choice:** Create three endpoints under `/v1/notifications`:
- `POST /v1/notifications/subscribe` - Save subscription
- `DELETE /v1/notifications/unsubscribe` - Remove subscription
- `POST /v1/notifications/send` - Send notification (internal use)

**Rationale:**
- RESTful design aligns with existing API patterns
- Authentication via existing JWT middleware
- Clear separation between user-facing (subscribe/unsubscribe) and internal (send) operations
- Send endpoint can be rate-limited and restricted to server-side use

**Alternatives considered:**
- WebSocket-based subscription management → rejected as unnecessary complexity
- Single unified endpoint with method parameter → rejected for clarity

### Decision 4: Service Worker Strategy
**Choice:** Keep service worker at `/public/sw.js` with minimal logic:
- Listen for push events
- Display notifications with data from payload
- Handle notification clicks to open app
- No caching or offline logic (future enhancement)

**Rationale:**
- Minimal scope reduces complexity
- Static file approach works well with Next.js
- Easy to debug and test
- Can be enhanced incrementally

**Alternatives considered:**
- Next.js service worker with Workbox → rejected as overkill for MVP
- Dynamic service worker generation → rejected for simplicity

### Decision 5: Permission Flow UX
**Choice:** Show drawer prompts after user is authenticated and on dashboard:
1. Check if notifications supported
2. Check current permission status
3. Show permission drawer if status is 'default' (not yet asked)
4. After permission granted, show install drawer if app is installable
5. Store dismissal preference in localStorage to avoid annoying users

**Rationale:**
- Non-intrusive timing (after auth, not immediately on landing)
- Progressive disclosure (permission first, then install)
- Respects user choice to dismiss
- Clear explanations in native language

**Alternatives considered:**
- Immediate prompts on landing page → rejected as too aggressive
- No install prompt → rejected as missing PWA opportunity
- Persistent prompts → rejected as poor UX

## Risks / Trade-offs

### Risk: Browser Compatibility
**Description:** Push notifications have varying support across browsers and iOS requires app to be installed to home screen.

**Mitigation:**
- Feature detection checks before showing prompts
- Platform-specific messaging for iOS users
- Graceful degradation if notifications not supported
- E2E tests skip on unsupported browsers

### Risk: VAPID Key Security
**Description:** Private VAPID key must be kept secure and not exposed in client code.

**Mitigation:**
- Store private key in environment variable (`VAPID_PRIVATE_KEY`)
- Only public key exposed to client (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`)
- Document key generation process in README
- Add validation that keys are configured before enabling notifications

### Risk: Stale Subscriptions
**Description:** Subscriptions can become invalid if user uninstalls browser or clears data.

**Mitigation:**
- Implement try-catch around send operations
- Log failed sends for monitoring
- Future: Add background job to clean up stale subscriptions
- User can re-subscribe easily via UI

### Risk: Notification Fatigue
**Description:** Too many notifications can annoy users and lead to unsubscribing.

**Mitigation:**
- MVP only sends on significant events (not every minor action)
- Future: Add user preferences for notification types
- Respect user unsubscribe choice
- Provide clear value proposition in permission drawer

## Migration Plan

**Phase 1: Backend Infrastructure**
1. Create `push_subscriptions` collection with indexes
2. Implement API endpoints with authentication
3. Add notification service utility for sending
4. Unit tests for repositories and services

**Phase 2: Frontend Redux & Utilities**
1. Create Redux notifications slice
2. Write unit tests achieving 100% coverage
3. Implement service worker registration utilities
4. Add subscription management functions

**Phase 3: UI Components**
1. Build permission drawer with translations
2. Build install drawer with platform detection
3. Integrate into dashboard layout
4. Style with Tailwind following design system

**Phase 4: Integration & Testing**
1. Wire up Redux slice to components
2. Test subscription flow end-to-end
3. Add E2E tests with Page Object pattern
4. Test on multiple browsers/devices

**Rollback Strategy:**
- Feature can be disabled via environment variable
- Drawer components can be hidden by not rendering
- API endpoints can be feature-flagged
- No breaking changes to existing functionality

## Open Questions

1. **Q:** Should we batch notifications to reduce noise?
   **A:** Defer to future enhancement. MVP sends individual notifications.

2. **Q:** How do we handle notification clicks for deep linking?
   **A:** Include target URL in notification payload and open in notification click handler.

3. **Q:** Should we support rich notifications with images?
   **A:** Yes, include icon and optionally image URL in notification payload.

4. **Q:** What events should trigger notifications?
   **A:** Start with: task assigned, task completed, karma granted, reward claimed. Expand later based on user feedback.
