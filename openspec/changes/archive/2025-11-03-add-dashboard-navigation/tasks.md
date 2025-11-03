# Tasks: Add Dashboard Navigation

## Installation & Setup

### 1. Install missing shadcn/ui components
Install the required shadcn/ui components that are not yet in the project.
- [x] Run `npx shadcn@latest add sheet`
- [x] Run `npx shadcn@latest add scroll-area`
- [x] Run `npx shadcn@latest add collapsible`
- [x] Run `npx shadcn@latest add badge`
- [x] Verify all components are added to `apps/web/src/components/ui/`

## i18n Updates

### 2. Add dashboard translations to English dictionary
Update the English translations file with all navigation and page labels.
- [x] Add `dashboard.navigation` section to `apps/web/src/dictionaries/en-US.json`
- [x] Include all navigation labels (dashboard, family, members, tasks, etc.)
- [x] Add `dashboard.pages` section with titles and placeholders for all pages
- [x] Include karma label with placeholder for count

### 3. Add dashboard translations to Dutch dictionary
Update the Dutch translations file with all navigation and page labels.
- [x] Add `dashboard.navigation` section to `apps/web/src/dictionaries/nl-NL.json`
- [x] Translate all navigation labels to Dutch
- [x] Add `dashboard.pages` section with Dutch translations
- [x] Include karma label with Dutch translation

## Component Development

### 4. Create DashboardLayout component
Build the main responsive layout component with three viewport variants.
- [x] Create `apps/web/src/components/layouts/dashboard-layout.tsx`
- [x] Mark as client component with `"use client"`
- [x] Define `DashboardLayoutProps` interface with children, className, mobileActions, title, dict
- [x] Import all necessary icons from lucide-react
- [x] Define navigation structure with sections and items

### 5. Implement desktop navigation variant
Build the full-width sidebar for desktop screens (lg+).
- [x] Create `DesktopNavContent` sub-component
- [x] Render logo with text at top
- [x] Implement scrollable navigation with sections
- [x] Add collapsible Family and Personal sections
- [x] Render user profile card at bottom with name, family, karma
- [x] Apply active state highlighting based on pathname
- [x] Style with design tokens (bg-card, border-border, etc.)

### 6. Implement tablet navigation variant
Build the icon-only sidebar for tablet screens (md to lg).
- [x] Create `TabletNavContent` sub-component
- [x] Render logo icon only at top
- [x] Flatten navigation into single list of all items
- [x] Render icon-only buttons with title attributes
- [x] Render user avatar at bottom with karma
- [x] Show small indicator dot for disabled items
- [x] Apply appropriate spacing for 80px width

### 7. Implement mobile navigation variant
Build the drawer navigation for mobile screens (< md).
- [x] Create `MobileNavContent` sub-component
- [x] Implement identical structure to desktop variant
- [x] Add click handlers to close drawer on navigation
- [x] Ensure collapsible sections work in drawer

### 8. Implement mobile header
Build the fixed header for mobile screens.
- [x] Render fixed header with border-b
- [x] Display Famly logo with text
- [x] Show optional page title if provided
- [x] Include language selector
- [x] Render optional mobile actions
- [x] Add Sheet trigger with menu icon button
- [x] Apply z-index for proper stacking

### 9. Assemble responsive layout
Combine all variants into the main layout component.
- [x] Render mobile header with `md:hidden` class
- [x] Render tablet sidebar with `hidden md:flex lg:hidden` classes
- [x] Render desktop sidebar with `hidden lg:flex` classes
- [x] Render main content area with responsive padding
- [x] Add `pt-20 md:pt-6` for mobile header spacing
- [x] Add `md:pl-20 lg:pl-72` for sidebar spacing

## Page Creation

### 10. Update dashboard overview page
Replace placeholder with layout-wrapped page.
- [x] Update `apps/web/src/app/[lang]/app/page.tsx`
- [x] Import DashboardLayout component
- [x] Get dictionary with `getDictionary(lang)`
- [x] Wrap content in DashboardLayout with dict prop
- [x] Display translated title and placeholder message
- [x] Center content on page

### 11. Create family members page
- [x] Create `apps/web/src/app/[lang]/app/family/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Family Members" title and coming soon message

### 12. Create tasks page
- [x] Create `apps/web/src/app/[lang]/app/tasks/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Tasks" title and coming soon message

### 13. Create shopping lists page
- [x] Create `apps/web/src/app/[lang]/app/shopping-lists/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Shopping Lists" title and coming soon message

### 14. Create rewards page
- [x] Create `apps/web/src/app/[lang]/app/rewards/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Rewards" title and coming soon message

### 15. Create calendar page
- [x] Create `apps/web/src/app/[lang]/app/calendar/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Calendar" title and coming soon message
- [x] Add note about feature coming soon

### 16. Create locations page
- [x] Create `apps/web/src/app/[lang]/app/locations/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Locations" title and coming soon message

### 17. Create memories page
- [x] Create `apps/web/src/app/[lang]/app/memories/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Memories" title and coming soon message

### 18. Create AI settings page
- [x] Create `apps/web/src/app/[lang]/app/ai-settings/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "AI Settings" title and coming soon message

### 19. Create diary page
- [x] Create `apps/web/src/app/[lang]/app/diary/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Diary" title and coming soon message

### 20. Create chat page
- [x] Create `apps/web/src/app/[lang]/app/chat/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Chat" title and coming soon message

### 21. Create settings page
- [x] Create `apps/web/src/app/[lang]/app/settings/page.tsx`
- [x] Import DashboardLayout and getDictionary
- [x] Render layout-wrapped placeholder with translated content
- [x] Display "Settings" title and coming soon message

## Testing & Validation

### 22. Create E2E test page object
Create a DashboardPage page object for robust E2E testing.
- [x] Create `apps/web/tests/e2e/pages/dashboard.page.ts`
- [x] Add testIds to DashboardLayout component
- [x] Define all necessary locators using getByTestId
- [x] Implement helper methods for navigation and interactions
- [x] Follow existing page object patterns

### 23. Create E2E test suite
Create comprehensive E2E tests for dashboard navigation.
- [x] Create `apps/web/tests/e2e/app/dashboard-navigation.spec.ts`
- [x] Test desktop layout responsive behavior
- [x] Test tablet layout responsive behavior
- [x] Test mobile layout and drawer interaction
- [x] Test navigation to all pages
- [x] Test section expand/collapse
- [x] Test active state highlighting
- [x] Test locale preservation on navigation

### 24. Run E2E tests
Execute the E2E tests to validate functionality.
- [ ] Run `pnpm test:e2e` for dashboard navigation tests
- [ ] Fix any failing tests
- [ ] Verify all navigation paths work correctly
- [ ] Ensure responsive layouts function properly
- [ ] Confirm drawer opens/closes on mobile

### 25. Test manual accessibility
Manual testing for accessibility features.
- [ ] Verify semantic HTML (aside, nav, main)
- [ ] Check keyboard navigation works
- [ ] Confirm focus indicators are visible
- [ ] Test screen reader announces labels correctly
- [ ] Verify drawer focus management
- [ ] Check color contrast ratios

### 26. Test internationalization
Test i18n functionality with multiple languages.
- [ ] Switch language to English, verify all labels
- [ ] Switch language to Dutch, verify all translations
- [ ] Check navigation labels update
- [ ] Check page titles and placeholders update
- [ ] Verify karma label translates correctly

### 27. Validate with OpenSpec
Run OpenSpec validation to ensure all requirements are met.
- [ ] Run `openspec validate add-dashboard-navigation --strict`
- [ ] Fix any validation errors
- [ ] Re-run validation until passing
- [ ] Commit changes

## Dependencies & Notes

**Parallelizable Tasks**:
- Tasks 2-3 (translations) can be done in parallel
- Tasks 11-21 (page creation) can be done in parallel after task 10 is complete

**Blocking Dependencies**:
- Task 4 requires task 1 (shadcn components)
- Tasks 5-8 require task 4 (main component structure)
- Task 9 requires tasks 5-8 (all variants)
- Tasks 10-21 require task 9 (complete layout component)
- Tasks 22-26 require all pages to be created

**External Dependencies**:
- Requires authentication from web-auth spec
- Requires existing i18n infrastructure
- Requires shadcn/ui base configuration
