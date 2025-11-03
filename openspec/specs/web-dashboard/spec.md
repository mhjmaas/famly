# web-dashboard Specification

## Purpose
TBD - created by archiving change add-dashboard-navigation. Update Purpose after archive.
## Requirements
### Requirement: Dashboard layout component
The web application MUST provide a responsive dashboard layout component that displays navigation and page content across all breakpoints.

#### Scenario: Desktop layout renders full sidebar
- **GIVEN** a user accessing the app on a desktop device (viewport width >= 1024px)
- **WHEN** the dashboard layout renders
- **THEN** a fixed sidebar appears on the left side with width 288px
- **AND** the sidebar displays the Famly logo with text at the top
- **AND** navigation items show with both icons and text labels
- **AND** Family and Personal sections are collapsible
- **AND** user profile card displays at the bottom with name, family name, and karma count
- **AND** main content area has left padding of 288px

#### Scenario: Tablet layout renders icon-only sidebar
- **GIVEN** a user accessing the app on a tablet device (viewport width 768px-1023px)
- **WHEN** the dashboard layout renders
- **THEN** a fixed sidebar appears on the left side with width 80px
- **AND** the sidebar displays the Famly logo icon only at the top
- **AND** navigation items show icons only without text labels
- **AND** all navigation items are displayed in a flat list (no collapsible sections)
- **AND** user avatar displays at the bottom with karma count
- **AND** main content area has left padding of 80px

#### Scenario: Mobile layout renders header with drawer
- **GIVEN** a user accessing the app on a mobile device (viewport width < 768px)
- **WHEN** the dashboard layout renders
- **THEN** a fixed header appears at the top
- **AND** the header displays Famly logo, optional page title, language selector, optional actions, and menu button
- **AND** no sidebar is visible by default
- **AND** main content area has top padding to account for fixed header
- **AND** main content area has no left padding

#### Scenario: User opens mobile navigation drawer
- **GIVEN** a user on a mobile device
- **WHEN** the user taps the menu button in the header
- **THEN** a drawer slides in from the left side
- **AND** the drawer displays full navigation identical to desktop layout
- **AND** the drawer includes logo, collapsible sections, navigation items, and user profile
- **AND** tapping outside the drawer or a navigation item closes the drawer

### Requirement: Navigation structure
The web application MUST organize navigation items into a hierarchical structure with single items and collapsible sections.

#### Scenario: Dashboard navigation item displays
- **GIVEN** a user viewing the dashboard layout
- **WHEN** the navigation renders
- **THEN** a "Dashboard" item appears with a Home icon
- **AND** the item links to `/app`
- **AND** the item highlights when the current path is `/app`

#### Scenario: Family section displays with nested items
- **GIVEN** a user viewing the dashboard layout on desktop or mobile drawer
- **WHEN** the navigation renders
- **THEN** a "Family" collapsible section appears with a Users icon
- **AND** the section contains 8 nested items: Members, Tasks, Shopping Lists, Rewards, Calendar, Locations, Memories, AI Settings
- **AND** each nested item displays an appropriate icon and links to its respective route
- **AND** the Calendar item shows a "Soon" badge and is non-clickable
- **AND** clicking the section header toggles expansion/collapse

#### Scenario: Personal section displays with nested items
- **GIVEN** a user viewing the dashboard layout on desktop or mobile drawer
- **WHEN** the navigation renders
- **THEN** a "Personal" collapsible section appears with a BookOpen icon
- **AND** the section contains 3 nested items: Diary, Chat, Settings
- **AND** each nested item displays an appropriate icon and links to its respective route
- **AND** clicking the section header toggles expansion/collapse

#### Scenario: Active navigation item is highlighted
- **GIVEN** a user on any app page
- **WHEN** the navigation renders
- **THEN** the navigation item matching the current URL path is highlighted with primary background color
- **AND** the text color changes to primary-foreground
- **AND** only one item is highlighted at a time

#### Scenario: Tablet layout shows flat navigation list
- **GIVEN** a user on a tablet device (viewport width 768px-1023px)
- **WHEN** the navigation renders
- **THEN** all navigation items are displayed in a single flat list
- **AND** Dashboard item appears first
- **AND** all Family section items appear next in order
- **AND** all Personal section items appear last in order
- **AND** no section headers or collapsible triggers are visible
- **AND** the Calendar item shows a small indicator dot but is non-clickable

### Requirement: User profile display
The web application MUST display user profile information in the navigation with karma count.

#### Scenario: Desktop profile card displays full information
- **GIVEN** a user viewing the dashboard layout on desktop
- **WHEN** the profile section renders
- **THEN** a profile card displays at the bottom of the sidebar
- **AND** the card shows a user avatar with initials
- **AND** the card displays the user's full name
- **AND** the card displays the family name
- **AND** the card displays karma count with a Sparkles icon
- **AND** the entire card is clickable and links to `/app/settings`

#### Scenario: Tablet profile displays avatar and karma
- **GIVEN** a user viewing the dashboard layout on tablet
- **WHEN** the profile section renders
- **THEN** a profile section displays at the bottom of the sidebar
- **AND** the section shows a user avatar with initials
- **AND** the section displays karma count with a Sparkles icon
- **AND** no name or family name is displayed
- **AND** the entire section is clickable and links to `/app/settings`

#### Scenario: Mobile drawer profile displays full information
- **GIVEN** a user viewing the navigation drawer on mobile
- **WHEN** the profile section renders
- **THEN** the profile displays identical to the desktop layout
- **AND** all profile information is visible (avatar, name, family name, karma)

### Requirement: Empty page stubs
The web application MUST provide placeholder pages for all navigation items that display a consistent "coming soon" message.

#### Scenario: Dashboard page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Dashboard" title
- **AND** the page shows a "Dashboard content coming soon" message

#### Scenario: Family members page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/family`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Family Members" title
- **AND** the page shows a "Family members page coming soon" message

#### Scenario: Tasks page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/tasks`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Tasks" title
- **AND** the page shows a "Tasks page coming soon" message

#### Scenario: Shopping lists page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/shopping-lists`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Shopping Lists" title
- **AND** the page shows a "Shopping lists page coming soon" message

#### Scenario: Rewards page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/rewards`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Rewards" title
- **AND** the page shows a "Rewards page coming soon" message

#### Scenario: Calendar page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/calendar`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Calendar" title
- **AND** the page shows a "Calendar page coming soon" message
- **AND** the page includes a note that this feature is coming soon

#### Scenario: Locations page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/locations`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Locations" title
- **AND** the page shows a "Locations page coming soon" message

#### Scenario: Memories page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/memories`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Memories" title
- **AND** the page shows a "Memories page coming soon" message

#### Scenario: AI settings page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/ai-settings`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "AI Settings" title
- **AND** the page shows a "AI settings page coming soon" message

#### Scenario: Diary page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/diary`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Diary" title
- **AND** the page shows a "Diary page coming soon" message

#### Scenario: Chat page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/chat`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Chat" title
- **AND** the page shows a "Chat page coming soon" message

#### Scenario: Settings page displays placeholder
- **GIVEN** an authenticated user
- **WHEN** the user navigates to `/app/settings`
- **THEN** the page displays within the dashboard layout
- **AND** the page shows a centered "Settings" title
- **AND** the page shows a "Settings page coming soon" message

### Requirement: Internationalization support
The web application MUST provide translations for all navigation labels and page titles in supported languages.

#### Scenario: Navigation labels are translated
- **GIVEN** a user with language preference set to English
- **WHEN** the navigation renders
- **THEN** all navigation items display in English
- **AND** "Dashboard" appears for the dashboard item
- **AND** "Family" appears for the family section header
- **AND** "Personal" appears for the personal section header
- **AND** all nested item labels are in English

#### Scenario: Navigation labels switch with language
- **GIVEN** a user viewing the dashboard with language set to Dutch
- **WHEN** the navigation renders
- **THEN** all navigation items display in Dutch
- **AND** the dashboard item shows the Dutch translation
- **AND** section headers and nested items show Dutch translations

#### Scenario: Page titles are translated
- **GIVEN** a user with language preference set to English
- **WHEN** any placeholder page renders
- **THEN** the page title displays in English
- **AND** the "coming soon" message displays in English

#### Scenario: Mobile header title is translated
- **GIVEN** a user on mobile with language preference set to English
- **WHEN** the dashboard layout receives a title prop
- **THEN** the title displays in the mobile header
- **AND** the title is properly translated based on the language preference

### Requirement: Design system consistency
The web application MUST apply the design system styling to all navigation and layout components.

#### Scenario: Navigation uses design tokens
- **GIVEN** any navigation rendering
- **WHEN** the component applies styles
- **THEN** inactive items use `text-muted-foreground` color
- **AND** active items use `bg-primary` background and `text-primary-foreground` color
- **AND** hover states use `hover:bg-accent` and `hover:text-accent-foreground`
- **AND** sidebar uses `bg-card` background
- **AND** borders use `border-border` color

#### Scenario: Navigation uses shadcn/ui components
- **GIVEN** any navigation rendering
- **WHEN** the component renders
- **THEN** mobile drawer uses Sheet, SheetContent, SheetTrigger components
- **AND** scrollable areas use ScrollArea component
- **AND** collapsible sections use Collapsible, CollapsibleTrigger, CollapsibleContent components
- **AND** "Soon" indicators use Badge component
- **AND** user profile uses Button component with ghost variant

#### Scenario: Icons are consistent with design system
- **GIVEN** any navigation rendering
- **WHEN** icons are displayed
- **THEN** all icons come from lucide-react library
- **AND** icon sizes are consistent (h-5 w-5 for main items, h-4 w-4 for nested items)
- **AND** Sparkles icon is used for karma display with fill-primary class

### Requirement: Responsive behavior
The web application MUST adapt the dashboard layout based on viewport size using Tailwind breakpoints.

#### Scenario: Layout switches at desktop breakpoint
- **GIVEN** a user resizing their browser window
- **WHEN** the viewport width crosses 1024px (lg breakpoint)
- **THEN** the layout switches between desktop and tablet variants
- **AND** the switch happens via CSS only (no JavaScript)
- **AND** the main content padding adjusts accordingly

#### Scenario: Layout switches at tablet breakpoint
- **GIVEN** a user resizing their browser window
- **WHEN** the viewport width crosses 768px (md breakpoint)
- **THEN** the layout switches between tablet and mobile variants
- **AND** the header appears/disappears accordingly
- **AND** the sidebar width adjusts or hides accordingly

#### Scenario: Mobile header is fixed at top
- **GIVEN** a user on a mobile device scrolling page content
- **WHEN** the page scrolls
- **THEN** the header remains fixed at the top of the viewport
- **AND** the header has z-index 50 to stay above page content
- **AND** page content has top padding to prevent overlap

### Requirement: Accessibility
The web application MUST ensure the dashboard layout is accessible to users with disabilities.

#### Scenario: Navigation uses semantic HTML
- **GIVEN** any navigation rendering
- **WHEN** the HTML is inspected
- **THEN** the sidebar uses `<aside>` element
- **AND** the navigation uses `<nav>` element
- **AND** the main content uses `<main>` element
- **AND** navigation links use `<a>` elements

#### Scenario: Icon-only items have accessible labels
- **GIVEN** a user on tablet viewing icon-only navigation
- **WHEN** a screen reader encounters navigation items
- **THEN** each item has an accessible title attribute
- **AND** the title contains the full item name

#### Scenario: Keyboard navigation is supported
- **GIVEN** a user navigating with keyboard
- **WHEN** the user tabs through navigation items
- **THEN** all interactive elements are keyboard accessible
- **AND** focus indicators are visible
- **AND** collapsible sections can be toggled with Enter/Space

#### Scenario: Mobile drawer focus is managed
- **GIVEN** a user opening the mobile navigation drawer
- **WHEN** the drawer opens
- **THEN** focus moves to the first navigation item
- **AND** pressing Escape closes the drawer
- **AND** closing the drawer returns focus to the menu button

