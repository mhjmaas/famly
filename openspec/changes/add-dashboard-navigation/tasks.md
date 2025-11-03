# Tasks: Add Dashboard Navigation

## Installation & Setup

### 1. Install missing shadcn/ui components
Install the required shadcn/ui components that are not yet in the project.
- [ ] Run `npx shadcn@latest add sheet`
- [ ] Run `npx shadcn@latest add scroll-area`
- [ ] Run `npx shadcn@latest add collapsible`
- [ ] Run `npx shadcn@latest add badge`
- [ ] Verify all components are added to `apps/web/src/components/ui/`

## i18n Updates

### 2. Add dashboard translations to English dictionary
Update the English translations file with all navigation and page labels.
- [ ] Add `dashboard.navigation` section to `apps/web/src/dictionaries/en-US.json`
- [ ] Include all navigation labels (dashboard, family, members, tasks, etc.)
- [ ] Add `dashboard.pages` section with titles and placeholders for all pages
- [ ] Include karma label with placeholder for count

### 3. Add dashboard translations to Dutch dictionary
Update the Dutch translations file with all navigation and page labels.
- [ ] Add `dashboard.navigation` section to `apps/web/src/dictionaries/nl-NL.json`
- [ ] Translate all navigation labels to Dutch
- [ ] Add `dashboard.pages` section with Dutch translations
- [ ] Include karma label with Dutch translation

## Component Development

### 4. Create DashboardLayout component
Build the main responsive layout component with three viewport variants.
- [ ] Create `apps/web/src/components/layouts/dashboard-layout.tsx`
- [ ] Mark as client component with `"use client"`
- [ ] Define `DashboardLayoutProps` interface with children, className, mobileActions, title, dict
- [ ] Import all necessary icons from lucide-react
- [ ] Define navigation structure with sections and items

### 5. Implement desktop navigation variant
Build the full-width sidebar for desktop screens (lg+).
- [ ] Create `DesktopNavContent` sub-component
- [ ] Render logo with text at top
- [ ] Implement scrollable navigation with sections
- [ ] Add collapsible Family and Personal sections
- [ ] Render user profile card at bottom with name, family, karma
- [ ] Apply active state highlighting based on pathname
- [ ] Style with design tokens (bg-card, border-border, etc.)

### 6. Implement tablet navigation variant
Build the icon-only sidebar for tablet screens (md to lg).
- [ ] Create `TabletNavContent` sub-component
- [ ] Render logo icon only at top
- [ ] Flatten navigation into single list of all items
- [ ] Render icon-only buttons with title attributes
- [ ] Render user avatar at bottom with karma
- [ ] Show small indicator dot for disabled items
- [ ] Apply appropriate spacing for 80px width

### 7. Implement mobile navigation variant
Build the drawer navigation for mobile screens (< md).
- [ ] Create `MobileNavContent` sub-component
- [ ] Implement identical structure to desktop variant
- [ ] Add click handlers to close drawer on navigation
- [ ] Ensure collapsible sections work in drawer

### 8. Implement mobile header
Build the fixed header for mobile screens.
- [ ] Render fixed header with border-b
- [ ] Display Famly logo with text
- [ ] Show optional page title if provided
- [ ] Include language selector
- [ ] Render optional mobile actions
- [ ] Add Sheet trigger with menu icon button
- [ ] Apply z-index for proper stacking

### 9. Assemble responsive layout
Combine all variants into the main layout component.
- [ ] Render mobile header with `md:hidden` class
- [ ] Render tablet sidebar with `hidden md:flex lg:hidden` classes
- [ ] Render desktop sidebar with `hidden lg:flex` classes
- [ ] Render main content area with responsive padding
- [ ] Add `pt-20 md:pt-6` for mobile header spacing
- [ ] Add `md:pl-20 lg:pl-72` for sidebar spacing

## Page Creation

### 10. Update dashboard overview page
Replace placeholder with layout-wrapped page.
- [ ] Update `apps/web/src/app/[lang]/app/page.tsx`
- [ ] Import DashboardLayout component
- [ ] Get dictionary with `getDictionary(lang)`
- [ ] Wrap content in DashboardLayout with dict prop
- [ ] Display translated title and placeholder message
- [ ] Center content on page

### 11. Create family members page
- [ ] Create `apps/web/src/app/[lang]/app/family/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Family Members" title and coming soon message

### 12. Create tasks page
- [ ] Create `apps/web/src/app/[lang]/app/tasks/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Tasks" title and coming soon message

### 13. Create shopping lists page
- [ ] Create `apps/web/src/app/[lang]/app/shopping-lists/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Shopping Lists" title and coming soon message

### 14. Create rewards page
- [ ] Create `apps/web/src/app/[lang]/app/rewards/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Rewards" title and coming soon message

### 15. Create calendar page
- [ ] Create `apps/web/src/app/[lang]/app/calendar/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Calendar" title and coming soon message
- [ ] Add note about feature coming soon

### 16. Create locations page
- [ ] Create `apps/web/src/app/[lang]/app/locations/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Locations" title and coming soon message

### 17. Create memories page
- [ ] Create `apps/web/src/app/[lang]/app/memories/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Memories" title and coming soon message

### 18. Create AI settings page
- [ ] Create `apps/web/src/app/[lang]/app/ai-settings/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "AI Settings" title and coming soon message

### 19. Create diary page
- [ ] Create `apps/web/src/app/[lang]/app/diary/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Diary" title and coming soon message

### 20. Create chat page
- [ ] Create `apps/web/src/app/[lang]/app/chat/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Chat" title and coming soon message

### 21. Create settings page
- [ ] Create `apps/web/src/app/[lang]/app/settings/page.tsx`
- [ ] Import DashboardLayout and getDictionary
- [ ] Render layout-wrapped placeholder with translated content
- [ ] Display "Settings" title and coming soon message

## Testing & Validation

### 22. Test desktop layout
- [ ] Verify sidebar appears at 1024px+ width
- [ ] Check logo displays with text
- [ ] Verify collapsible sections expand/collapse
- [ ] Confirm active state highlights current page
- [ ] Verify user profile displays all information
- [ ] Test navigation to all pages

### 23. Test tablet layout
- [ ] Verify icon-only sidebar appears at 768px-1023px width
- [ ] Check logo shows icon only
- [ ] Verify all items in flat list
- [ ] Confirm tooltips/titles on icon buttons
- [ ] Verify user avatar and karma display
- [ ] Test navigation to all pages

### 24. Test mobile layout
- [ ] Verify header appears at < 768px width
- [ ] Check drawer opens/closes on menu button
- [ ] Verify drawer navigation identical to desktop
- [ ] Confirm navigation closes drawer on item click
- [ ] Test language selector in header
- [ ] Verify page title appears when provided

### 25. Test internationalization
- [ ] Switch language to English, verify all labels
- [ ] Switch language to Dutch, verify all translations
- [ ] Check navigation labels update
- [ ] Check page titles and placeholders update
- [ ] Verify karma label translates correctly

### 26. Test accessibility
- [ ] Verify semantic HTML (aside, nav, main)
- [ ] Check keyboard navigation works
- [ ] Confirm focus indicators are visible
- [ ] Test screen reader announces labels correctly
- [ ] Verify drawer focus management
- [ ] Check color contrast ratios

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
