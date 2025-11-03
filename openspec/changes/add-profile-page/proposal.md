# Add Profile Page

## Status
PROPOSED

## Problem
Users currently have no way to view or manage their profile information, preferences, or activity history. The dashboard navigation shows hardcoded user data (name, karma) with a link to `/app/settings`, but that page only displays a placeholder. The reference design includes a comprehensive profile/settings page with user information, preferences (theme and language), and an activity timeline showing karma-earning and karma-spending events.

## Solution
Implement a fully functional profile page that:
1. Displays authenticated user information (name, age, role, karma balance)
2. Shows user preferences with working theme and language selectors
3. Displays a chronological activity timeline of tasks completed and rewards claimed
4. Integrates with existing API endpoints (`/v1/auth/me`, `/v1/families/:familyId/karma/balance/:userId`, `/v1/activity-events`)
5. Populates the dashboard navigation with real user data instead of hardcoded values
6. Uses Redux Toolkit for global state management (essential for the complexity ahead)

The solution follows Next.js 15 + React 19 patterns using Server Components for initial data loading and Client Components for interactive elements. State management will use Redux Toolkit to handle interconnected application state (user, karma, tasks, rewards) that needs synchronization across multiple views.

## State Management Decision
After thoroughly investigating state management options and analyzing the reference design:

**Why Redux Toolkit:**
- **Essential for app complexity:** Reference design shows 6+ interconnected views (dashboard, tasks, rewards, family, chat, shopping lists)
- **Karma synchronization critical:** Karma changes from tasks/rewards must update across profile, dashboard, rewards progress, and family views simultaneously
- **Performance optimization:** Selective re-renders via slices (only components using changed data re-render)
- **Normalized state:** Store karma once, reference everywhere (single source of truth)
- **Developer experience:** Time-travel debugging, Redux DevTools, middleware ecosystem
- **Type safety:** Full TypeScript support out of the box
- **Future-proof:** Adding tasks, rewards, chat won't require refactoring
- **Acceptable bundle size:** ~10KB gzipped for the value provided
- **Server state integration:** Can add RTK Query later for API caching/optimistic updates

**Why NOT React Context (Initial Assessment Was Wrong):**
- Context causes ALL consumers to re-render on any state change (performance issue)
- No built-in way to handle normalized/computed state
- Prop drilling still needed for deep component trees
- No middleware for side effects (logging, persistence, async)
- No DevTools for debugging state changes
- Difficult to split into multiple contexts without complexity explosion
- Will require painful refactor when adding tasks/rewards (2-3 months)

**Implementation Strategy:**
1. Install Redux Toolkit + React-Redux
2. Create store with initial slices: `user` and `karma`
3. Configure Redux Provider at root layout level
4. Load initial state server-side, hydrate Redux store
5. Settings page dispatches actions to load additional data
6. Dashboard navigation uses Redux selectors for real-time updates
7. Future slices: `tasks`, `rewards`, `family`, `chat`, `shoppingLists`

## Scope
### In Scope
- Install Redux Toolkit and React-Redux dependencies
- Set up Redux store with user and karma slices
- Configure Redux Provider with server-side state hydration
- Profile page UI matching reference design (user card, preferences card, activity timeline)
- Integration with `/v1/auth/me` endpoint for user data
- Integration with `/v1/families/:familyId/karma/balance/:userId` for karma balance
- Integration with `/v1/activity-events` for activity timeline
- Redux selectors and typed hooks (useAppSelector, useAppDispatch)
- Populate dashboard navigation with real user data from Redux store
- Working theme selector (already implemented, just needs integration)
- Working language selector (already implemented, just needs integration)
- Missing UI components: Avatar, DropdownMenu, Dialog, Select
- Activity event type definitions and formatting
- Internationalization for profile page content
- Unit tests for slices, selectors, components, and formatters
- E2E tests for profile page functionality

### Out of Scope
- Edit profile functionality (will be addressed in future change)
- Logout functionality (will be addressed in future change)
- Photo upload (not in MVP)
- Family switching UI (only one family per user in MVP)
- Real-time activity updates (no WebSocket integration yet)
- Pagination for activity timeline (limit to 100 most recent events)

## Dependencies
- Requires existing authentication system (auth module)
- Requires existing karma system (karma module)
- Requires existing activity-events module
- Requires existing family membership data
- Requires existing theme-provider and language-selector components

## Risks
1. **API Response Shape:** The `/v1/auth/me` response includes families array, but we need to ensure it contains karma data or make a separate call to karma endpoint
2. **First Family Assumption:** MVP assumes users belong to only one family; we'll need to handle the multi-family case gracefully in the future
3. **Activity Event Types:** Need to ensure activity-events module returns all necessary event types (task completion, reward claims)
4. **Server/Client Boundary:** Need to carefully manage what data is fetched server-side vs client-side to maintain performance
5. **Redux Hydration:** Must handle Redux store hydration from server-side data correctly to avoid flicker/mismatch errors
6. **Learning Curve:** Team needs to learn Redux Toolkit patterns (but this is a one-time investment)

## Success Criteria
1. Settings page matches reference design visually
2. Real user data appears in dashboard navigation (name, karma)
3. Theme and language selectors work and persist preferences
4. Activity timeline displays recent events with proper formatting and grouping
5. All API integrations work with proper error handling
6. Context provides user data to all components that need it
7. Page is responsive across mobile, tablet, and desktop
8. All tests pass (unit + e2e)
9. No console errors or warnings in development
10. Follows project's TDD and SOLID principles from constitution.md
