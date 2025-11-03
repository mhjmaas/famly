# Design: Add Dashboard Navigation

## Architecture Overview
The dashboard navigation follows a responsive three-tier layout pattern:

```
┌─────────────────────────────────────────────────┐
│ Mobile (<md):                                   │
│ ┌─────────────────────────────────────────┐    │
│ │ Header (Logo + Actions + Menu)          │    │
│ └─────────────────────────────────────────┘    │
│ ┌─────────────────────────────────────────┐    │
│ │                                          │    │
│ │         Page Content                     │    │
│ │                                          │    │
│ └─────────────────────────────────────────┘    │
│                                                 │
│ Drawer Navigation (on menu open)               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Tablet (md-lg):                                 │
│ ┌──┐ ┌──────────────────────────────────┐      │
│ │  │ │                                   │      │
│ │  │ │       Page Content                │      │
│ │I │ │                                   │      │
│ │c │ │                                   │      │
│ │o │ │                                   │      │
│ │n │ │                                   │      │
│ │s │ │                                   │      │
│ │  │ │                                   │      │
│ └──┘ └──────────────────────────────────┘      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Desktop (lg+):                                  │
│ ┌────────────┐ ┌─────────────────────────┐     │
│ │            │ │                          │     │
│ │  Full      │ │   Page Content           │     │
│ │  Sidebar   │ │                          │     │
│ │  with      │ │                          │     │
│ │  Text      │ │                          │     │
│ │            │ │                          │     │
│ └────────────┘ └─────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

## Component Structure

### DashboardLayout Component
**Location**: `apps/web/src/components/layouts/dashboard-layout.tsx`

The main layout component that orchestrates the three responsive variants.

**Props**:
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  mobileActions?: React.ReactNode  // Additional action buttons for mobile header
  title?: string                   // Page title shown in mobile header
  dict: Dictionary                 // i18n dictionary
}
```

**Key Features**:
- Server Component compatible for i18n
- Manages collapsible section state
- Renders appropriate layout variant based on breakpoints
- Shows user karma and profile info

### Navigation Structure
Navigation is organized into sections from the reference design:

1. **Single Items**:
   - Dashboard (Home icon, `/app`)

2. **Family Section** (Users icon):
   - Members (`/app/family`)
   - Tasks (`/app/tasks`)
   - Shopping Lists (`/app/shopping-lists`)
   - Rewards (`/app/rewards`)
   - Calendar (`/app/calendar`) - disabled with "Soon" badge
   - Locations (`/app/locations`)
   - Memories (`/app/memories`)
   - AI Settings (`/app/ai-settings`)

3. **Personal Section** (BookOpen icon):
   - Diary (`/app/diary`)
   - Chat (`/app/chat`)
   - Settings (`/app/settings`)

### Responsive Behavior

#### Desktop (lg: 1024px+)
- Fixed sidebar, 288px wide (w-72)
- Full navigation with text labels
- Collapsible sections (Family, Personal)
- User profile card at bottom with karma display
- Logo with text at top

#### Tablet (md: 768px to lg: 1023px)
- Fixed sidebar, 80px wide (w-20)
- Icon-only navigation
- All items shown in flat list (no sections)
- User avatar at bottom with karma
- Logo icon only at top

#### Mobile (< md: 768px)
- Fixed header at top
- Sheet/Drawer navigation from left
- Full navigation like desktop when drawer open
- Logo + page title + actions + menu button in header
- Language selector in header

## Styling Approach

### Tailwind CSS with Design Tokens
All styling uses Tailwind CSS with the existing design system tokens:

- `bg-card`: Sidebar background
- `border-border`: Borders
- `text-primary`: Active navigation items
- `bg-primary`: Active navigation background
- `text-muted-foreground`: Inactive items
- `hover:bg-accent`: Hover states

### Component Library
Uses shadcn/ui components:
- `Sheet` + `SheetContent` + `SheetTrigger`: Mobile drawer
- `ScrollArea`: Scrollable navigation lists
- `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent`: Expandable sections
- `Button`: Menu button and user profile
- `Badge`: "Soon" indicators for disabled items

### Icons
Uses `lucide-react` icons matching the reference design:
- Home, Users, BookOpen: Section icons
- CheckSquare, ShoppingCart, Gift, Calendar, MapPin, Camera, Bot: Feature icons
- MessageSquare, Settings: Personal icons
- Sparkles: Karma indicator
- Menu, ChevronDown: UI controls

## i18n Integration

### Dictionary Structure
Add to `apps/web/src/dictionaries/[lang].json`:

```json
{
  "dashboard": {
    "navigation": {
      "dashboard": "Dashboard",
      "family": "Family",
      "members": "Members",
      "tasks": "Tasks",
      "shoppingLists": "Shopping Lists",
      "rewards": "Rewards",
      "calendar": "Calendar",
      "locations": "Locations",
      "memories": "Memories",
      "aiSettings": "AI Settings",
      "personal": "Personal",
      "diary": "Diary",
      "chat": "Chat",
      "settings": "Settings",
      "soon": "Soon",
      "karma": "{count} Karma"
    },
    "pages": {
      "dashboard": {
        "title": "Dashboard",
        "placeholder": "Dashboard content coming soon"
      },
      "family": {
        "title": "Family Members",
        "placeholder": "Family members page coming soon"
      },
      // ... etc for each page
    }
  }
}
```

### i18n Implementation
- Each page receives dictionary via `getDictionary(lang)`
- DashboardLayout receives `dict` prop with navigation labels
- All text is translatable, no hardcoded strings
- Both en-US and nl-NL translations provided

## State Management

### Client State Only
The only client state is:
- `mobileOpen`: boolean for Sheet open/close
- `expandedSections`: string[] for collapsible sections

No global state needed - navigation state is ephemeral UI state.

### URL-based Active State
Active navigation item determined by `usePathname()` hook:
- Exact match for single items
- Path prefix match for section items
- No localStorage or cookies needed

## Missing Shadcn Components

The following components need to be installed:
1. `sheet` - Mobile drawer navigation
2. `scroll-area` - Scrollable navigation lists
3. `collapsible` - Expandable sections
4. `badge` - "Soon" indicators
5. `avatar` - User profile (optional, can use div)
6. `dropdown-menu` - Future profile menu (optional)

Install command:
```bash
npx shadcn@latest add sheet scroll-area collapsible badge avatar dropdown-menu
```

## File Structure
```
apps/web/src/
├── components/
│   └── layouts/
│       └── dashboard-layout.tsx       # Main layout component
├── app/[lang]/app/
│   ├── page.tsx                       # Dashboard overview (updated)
│   ├── family/
│   │   └── page.tsx                   # Family members page
│   ├── tasks/
│   │   └── page.tsx                   # Tasks page
│   ├── shopping-lists/
│   │   └── page.tsx                   # Shopping lists page
│   ├── rewards/
│   │   └── page.tsx                   # Rewards page
│   ├── calendar/
│   │   └── page.tsx                   # Calendar page (disabled)
│   ├── locations/
│   │   └── page.tsx                   # Locations page
│   ├── memories/
│   │   └── page.tsx                   # Memories page
│   ├── ai-settings/
│   │   └── page.tsx                   # AI settings page
│   ├── diary/
│   │   └── page.tsx                   # Diary page
│   ├── chat/
│   │   └── page.tsx                   # Chat page
│   └── settings/
│       └── page.tsx                   # Settings page
└── dictionaries/
    ├── en-US.json                     # English translations (updated)
    └── nl-NL.json                     # Dutch translations (updated)
```

## Performance Considerations

### Code Splitting
- DashboardLayout is client component (`"use client"`)
- Individual pages can be server components
- Icons imported from lucide-react (tree-shakeable)

### Responsive Design
- CSS-only responsive behavior (no JS)
- Fixed layouts (no JS calculations)
- Tailwind purge removes unused styles

### Accessibility
- Semantic HTML (nav, main, aside)
- ARIA labels on icon-only buttons
- Keyboard navigation support
- Focus management for Sheet/drawer
