# Change: Add Household Contribution Goals

## Why

Families need a way to set baseline weekly expectations for household participation beyond discrete tasks. The current system only tracks one-time or recurring chores, but doesn't provide a mechanism for parents to establish a weekly contribution baseline where children can earn karma simply by maintaining household standards (e.g., keeping room clean, basic responsibilities) with deductions for failures rather than rewards for each small action.

## What Changes

This change introduces a **Weekly Contribution Goal** system that allows:
- Parents to set a weekly karma goal for any family member (including themselves)
- Automatic conversion of remaining potential karma to actual karma every Sunday at 18:00 UTC
- Real-time deduction tracking with reasons that appear in the activity trail
- Dashboard visibility for members to see their own progress
- Member detail page showing contribution goal progress with quick deduction interface for parents
- Push and WebSocket notifications when weekly karma is awarded

Key characteristics:
- Goals reset weekly (Sunday 18:00 UTC)
- No history tracking (current week only)
- Deductions reduce potential karma, remainder is awarded at week end
- Completely separate from tasks and rewards system
- Integrates with existing karma, activity events, and notification infrastructure

## Impact

**New Capabilities:**
- `contribution-goals` - Core domain model and business logic
- `api-contribution-goals` - API routes for CRUD operations and deductions
- `web-contribution-goals` - Redux slice, UI components, and E2E tests

**Modified Capabilities:**
- `karma` - Extend to support contribution goal awards via cron job
- `activity-events` - Add CONTRIBUTION_GOAL event type for deduction tracking
- `realtime-events` - Add contribution goal events for real-time updates
- `pwa-notifications` - Add notification template for weekly karma awards
- `web-dashboard` - Add contribution goal card to dashboard view

**Affected Code:**
- Backend: New `contribution-goals` module with repository, service, routes, validators, cron scheduler
- API: New endpoints under `/families/:familyId/contribution-goals/*`
- Web: New Redux slice, dashboard component, member detail tab, translations
- Database: New `contribution-goals` collection in MongoDB
- Infrastructure: New cron job scheduler for weekly karma conversion

**Breaking Changes:** None - this is purely additive

**Migration:** None required - new feature with no data migration

**Dependencies:**
- Uses existing karma service for awarding converted karma
- Uses existing activity event service for logging deductions
- Uses existing notification service for push and realtime notifications
- Uses existing family membership validation patterns
- Uses CronJob library (already in use for task scheduling)
