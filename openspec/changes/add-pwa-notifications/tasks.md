# Implementation Tasks

## 1. Backend - Database & Models
- [ ] 1.1 Create `push_subscriptions` collection in MongoDB
- [ ] 1.2 Add indexes: unique on `endpoint`, standard on `userId`
- [ ] 1.3 Define TypeScript interfaces for PushSubscription domain model
- [ ] 1.4 Create subscription mapper for database transformations

## 2. Backend - API Module (notifications)
- [ ] 2.1 Create `src/modules/notifications` directory structure
- [ ] 2.2 Implement `push-subscription.repository.ts` with CRUD operations
- [ ] 2.3 Write unit tests for repository (create, find, delete)
- [ ] 2.4 Implement `notification.service.ts` for business logic
- [ ] 2.5 Write unit tests for service layer
- [ ] 2.6 Create Zod validators for subscribe/unsubscribe endpoints
- [ ] 2.7 Implement `POST /v1/notifications/subscribe` route with auth
- [ ] 2.8 Implement `DELETE /v1/notifications/unsubscribe` route with auth
- [ ] 2.9 Implement `POST /v1/notifications/send` route (internal)
- [ ] 2.10 Add notification router to main app
- [ ] 2.11 Write E2E tests for subscribe endpoint
- [ ] 2.12 Write E2E tests for unsubscribe endpoint
- [ ] 2.13 Create notification utility for sending push from backend events

## 3. Frontend - Redux State Management
- [ ] 3.1 Create `src/store/slices/notifications.slice.ts`
- [ ] 3.2 Define NotificationsState interface with all required fields
- [ ] 3.3 Implement async thunks: `subscribeToNotifications`, `unsubscribeFromNotifications`, `checkSubscriptionStatus`
- [ ] 3.4 Implement reducers: `setPermissionStatus`, `setSubscription`, `showPermissionDrawer`, `hidePermissionDrawer`, `showInstallDrawer`, `hideInstallDrawer`, `setCanInstall`
- [ ] 3.5 Add notifications reducer to store.ts
- [ ] 3.6 Create `notifications.slice.test.ts` with 100% coverage
- [ ] 3.7 Test initial state
- [ ] 3.8 Test all reducers
- [ ] 3.9 Test all async thunk states (pending, fulfilled, rejected)
- [ ] 3.10 Test edge cases and error handling

## 4. Frontend - Service Worker & Utilities
- [ ] 4.1 Update `/public/sw.js` with production-ready notification handling
- [ ] 4.2 Add notification click handler with deep linking
- [ ] 4.3 Create `src/lib/pwa/service-worker.ts` utility
- [ ] 4.4 Implement `registerServiceWorker()` function
- [ ] 4.5 Implement `getSubscription()` function
- [ ] 4.6 Implement `subscribeUser()` with VAPID key conversion
- [ ] 4.7 Implement `unsubscribeUser()` function
- [ ] 4.8 Create `src/lib/pwa/notifications.ts` utility
- [ ] 4.9 Implement `checkNotificationSupport()` function
- [ ] 4.10 Implement `requestNotificationPermission()` function
- [ ] 4.11 Implement `getNotificationPermissionStatus()` function
- [ ] 4.12 Create `src/lib/pwa/install.ts` utility
- [ ] 4.13 Implement `captureInstallPrompt()` event listener
- [ ] 4.14 Implement `triggerInstallPrompt()` function
- [ ] 4.15 Implement platform detection functions (iOS, Android, Desktop)

## 5. Frontend - UI Components
- [ ] 5.1 Create `src/components/pwa/notification-permission-drawer.tsx`
- [ ] 5.2 Implement drawer with shadcn/ui Drawer component
- [ ] 5.3 Add benefit explanations with translated text
- [ ] 5.4 Add "Allow" and "Not Now" buttons with proper actions
- [ ] 5.5 Add data-testid attributes for testing
- [ ] 5.6 Create `src/components/pwa/install-prompt-drawer.tsx`
- [ ] 5.7 Implement drawer with platform-specific instructions
- [ ] 5.8 Add iOS-specific UI with share icon guidance
- [ ] 5.9 Add Android/Desktop install button
- [ ] 5.10 Add data-testid attributes for testing
- [ ] 5.11 Style both drawers with Tailwind following design system

## 6. Frontend - Dashboard Integration
- [ ] 6.1 Update `src/components/layouts/dashboard-layout.tsx`
- [ ] 6.2 Add useEffect to check notification support on mount
- [ ] 6.3 Dispatch permission status check from Redux
- [ ] 6.4 Show permission drawer if status is 'default' and not dismissed
- [ ] 6.5 Show install drawer after permission granted if installable
- [ ] 6.6 Store dismissal state in localStorage
- [ ] 6.7 Add notification badge/icon to show subscription status

## 7. Translations
- [ ] 7.1 Add notification keys to `src/dictionaries/en-US.json`
- [ ] 7.2 Add keys: `pwa.notifications.title`, `description`, `benefits.*`, `allow`, `notNow`
- [ ] 7.3 Add install keys: `pwa.install.title`, `description`, `iosInstructions`, `install`, `later`
- [ ] 7.4 Add notification keys to `src/dictionaries/nl-NL.json`
- [ ] 7.5 Translate all notification text to Dutch
- [ ] 7.6 Translate all install prompt text to Dutch
- [ ] 7.7 Add error message translations for both languages

## 8. E2E Tests
- [ ] 8.1 Create `tests/e2e/pages/notifications.page.ts` Page Object
- [ ] 8.2 Add locators for permission drawer elements
- [ ] 8.3 Add locators for install drawer elements
- [ ] 8.4 Add helper methods: `openPermissionDrawer()`, `grantPermission()`, `denyPermission()`
- [ ] 8.5 Add helper methods: `openInstallDrawer()`, `installApp()`, `dismissInstall()`
- [ ] 8.6 Create `tests/e2e/app/pwa/notifications.spec.ts`
- [ ] 8.7 Test: should detect notification support
- [ ] 8.8 Test: should show permission drawer when not granted
- [ ] 8.9 Test: should subscribe to notifications when permission granted
- [ ] 8.10 Test: should handle permission denial gracefully
- [ ] 8.11 Test: should unsubscribe from notifications
- [ ] 8.12 Test: should show install drawer when app is installable
- [ ] 8.13 Test: should respect drawer dismissal preference
- [ ] 8.14 Create `tests/e2e/app/pwa/install-prompt.spec.ts`
- [ ] 8.15 Test: should show iOS-specific instructions on iOS
- [ ] 8.16 Test: should trigger install prompt on supported browsers
- [ ] 8.17 Test: should handle install prompt cancellation

## 9. Backend Integration & Events
- [ ] 9.1 Integrate notification sending into task completion handler
- [ ] 9.2 Integrate notification sending into karma grant handler
- [ ] 9.3 Integrate notification sending into reward claim handler
- [ ] 9.4 Add error handling and logging for failed notifications
- [ ] 9.5 Create notification content templates for each event type

## 10. Documentation & Configuration
- [ ] 10.1 Document VAPID key generation in README
- [ ] 10.2 Add environment variable documentation
- [ ] 10.3 Update `.env.example` with notification variables
- [ ] 10.4 Add troubleshooting guide for common issues
- [ ] 10.5 Document browser compatibility notes

## 11. Validation & Quality Assurance
- [ ] 11.1 Run `pnpm test` and ensure all unit tests pass
- [ ] 11.2 Run `pnpm test:unit:coverage` and verify 100% Redux slice coverage
- [ ] 11.3 Run `pnpm test:e2e` and ensure all E2E tests pass
- [ ] 11.4 Run `pnpm run lint` and fix any issues
- [ ] 11.5 Test on Chrome desktop
- [ ] 11.6 Test on Firefox desktop
- [ ] 11.7 Test on Safari desktop
- [ ] 11.8 Test on Chrome mobile (Android)
- [ ] 11.9 Test on Safari mobile (iOS)
- [ ] 11.10 Validate `openspec validate add-pwa-notifications --strict` passes
