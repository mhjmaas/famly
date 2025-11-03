# Proposal: Add Dashboard Navigation

## Summary
Add the main navigation layout and empty page stubs for all app sections based on the reference design. This includes desktop sidebar, tablet icon-only sidebar, and mobile header with drawer navigation. All navigation items will have i18n support and use shadcn/ui components.

## Problem
The current `/app` route only shows placeholder text. Users need a complete navigation system to access different sections of the application (tasks, rewards, shopping lists, diary, chat, etc.), and the app needs responsive layouts for desktop, tablet, and mobile devices.

## Solution
Implement the `DashboardLayout` component from the reference design with three responsive variants:
- **Desktop (lg+)**: Full sidebar with text labels and collapsible sections
- **Tablet (md-lg)**: Icon-only sidebar with tooltips
- **Mobile (<md)**: Header with hamburger menu opening a drawer

Create empty page stubs for all navigation items:
- Dashboard (overview)
- Family section: Members, Tasks, Shopping Lists, Rewards, Locations, Memories, AI Settings
- Personal section: Diary, Chat, Settings

Add complete i18n support for all navigation labels and page content.

## Dependencies
- Requires web-auth spec (authentication for protected routes)
- Needs shadcn/ui components: Sheet, ScrollArea, Collapsible, Badge, Avatar, Dropdown Menu

## Scope
This change affects the web-dashboard spec only. It does not include:
- Actual functionality for any pages (just empty stubs)
- Calendar feature (marked as "Soon")
- Integration with backend APIs beyond authentication
- User profile data (hardcoded for now)

## Migration Impact
None - this is a new feature with no breaking changes.

## Alternatives Considered
1. Build only desktop layout first - Rejected: mobile-first approach is essential
2. Use a different component library - Rejected: shadcn/ui is already established in the project
3. Server-side navigation state - Rejected: client-side is more responsive for collapsible sections
