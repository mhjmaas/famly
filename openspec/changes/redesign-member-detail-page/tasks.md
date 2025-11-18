# Implementation Tasks

## 1. Update Member Overview Cards
- [ ] 1.1 Remove dropdown menu from `FamilyMemberCard` component
- [ ] 1.2 Add clickable card wrapper or "View Details" link to navigate to member detail page
- [ ] 1.3 Update card styling to indicate it's clickable (hover states, cursor pointer)
- [ ] 1.4 Add data-testid attributes for E2E testing

## 2. Remove Dialogs from Family View
- [ ] 2.1 Remove `EditRoleDialog`, `RemoveMemberDialog`, and `GiveKarmaDialog` imports and usage from `FamilyView`
- [ ] 2.2 Remove dialog state management (useState hooks for dialog open/close)
- [ ] 2.3 Remove dialog handler functions (handleEditRole, handleRemove, handleGiveKarma)
- [ ] 2.4 Keep `AddMemberDialog` as it's still needed for adding new members
- [ ] 2.5 Delete `give-karma-dialog.tsx` file (replaced by MemberKarmaCard)

## 3. Create Member Detail Page Route
- [ ] 3.1 Create `/apps/web/src/app/[lang]/app/family/[memberId]/page.tsx`
- [ ] 3.2 Implement server component with proper params handling
- [ ] 3.3 Fetch dictionary for i18n support
- [ ] 3.4 Pass member data and translations to detail view component

## 4. Create Member Detail View Component
- [ ] 4.1 Create `MemberDetailView` component in `/apps/web/src/components/family/`
- [ ] 4.2 Implement header section with member name (title) and age (description)
- [ ] 4.3 Add avatar and karma display in top-right corner
- [ ] 4.4 Implement breadcrumb navigation (Family Members > [Member Name])
- [ ] 4.5 Add back button for mobile navigation
- [ ] 4.6 Add dropdown menu (three dots) for edit/delete actions (parent users only)
- [ ] 4.7 Position dropdown menu at same level as tabs, aligned to the right
- [ ] 4.8 Integrate existing `EditRoleDialog` and `RemoveMemberDialog` components (reused from family view)
- [ ] 4.9 Add data-testid attributes throughout for E2E testing

## 5. Create Tabs Navigation
- [ ] 5.1 Implement shadcn Tabs component with single "Give Karma" tab
- [ ] 5.2 Create flex container with tabs (center-aligned) and actions menu (right-aligned)
- [ ] 5.3 Ensure actions dropdown menu is at same level as tabs, not inside tab content
- [ ] 5.4 Ensure tab content area is properly styled

## 6. Create Simplified Karma Card
- [ ] 6.1 Create `MemberKarmaCard` component
- [ ] 6.2 Implement karma amount input (accepts positive or negative numbers directly)
- [ ] 6.3 Add description textarea with required validation
- [ ] 6.4 Add "Give Karma" button with Sparkles icon
- [ ] 6.5 Integrate with Redux `grantMemberKarma` thunk
- [ ] 6.6 Handle loading states during karma grant
- [ ] 6.7 Display success/error messages via toast
- [ ] 6.8 Add helper text explaining positive/negative input
- [ ] 6.9 Add data-testid attributes for testing

## 7. Integrate Activity Timeline
- [ ] 7.1 Reuse `ActivityTimeline` component from profile page
- [ ] 7.2 Filter activity events by member ID
- [ ] 7.3 Fetch member-specific activity events from API
- [ ] 7.4 Display timeline below karma card following reference design
- [ ] 7.5 Ensure proper spacing and layout consistency

## 8. Update Redux Store
- [ ] 8.1 Add selector `selectFamilyMemberById(memberId)` to family slice
- [ ] 8.2 Ensure `grantMemberKarma` thunk properly updates karma in both family and karma slices
- [ ] 8.3 Verify all existing thunks work correctly with new page structure

## 9. Add Translations
- [ ] 9.1 Add member detail page translations to `en-US.json`
- [ ] 9.2 Add member detail page translations to `nl-NL.json`
- [ ] 9.3 Include translations for:
  - Page breadcrumbs
  - Tab labels
  - Karma card labels and placeholders
  - Activity timeline section
  - Edit/delete menu items
  - Success/error messages
  - Validation messages

## 10. Create E2E Tests
- [ ] 10.1 Create `family-member-detail.page.ts` page object with locators and helpers
- [ ] 10.2 Create `family-member-detail.spec.ts` test file
- [ ] 10.3 Test navigation from family overview to detail page
- [ ] 10.4 Test member information display (name, age, avatar, karma)
- [ ] 10.5 Test breadcrumb navigation
- [ ] 10.6 Test tab switching (when multiple tabs exist)
- [ ] 10.7 Test karma grant with positive amount
- [ ] 10.8 Test karma deduction with negative amount
- [ ] 10.9 Test karma validation (empty description, zero amount)
- [ ] 10.10 Test edit role dialog from detail page
- [ ] 10.11 Test remove member dialog from detail page
- [ ] 10.12 Test activity timeline displays member events
- [ ] 10.13 Test responsive behavior (mobile, tablet, desktop)
- [ ] 10.14 Test parent vs child user permissions

## 11. Add Unit Tests for Redux
- [ ] 11.1 Add tests for `selectFamilyMemberById` selector
- [ ] 11.2 Ensure 100% coverage of new Redux code
- [ ] 11.3 Test karma grant updates both family and karma slices
- [ ] 11.4 Test error handling in karma operations

## 12. Update Existing Tests
- [ ] 12.1 Update `family.spec.ts` E2E tests to reflect removed dialogs from overview
- [ ] 12.2 Update `family.page.ts` page object to remove dialog-related locators
- [ ] 12.3 Ensure all existing family tests still pass

## 13. Component Decomposition
- [ ] 13.1 Break down large components into smaller logical pieces
- [ ] 13.2 Create `MemberDetailHeader` component for header section
- [ ] 13.3 Create `MemberDetailActions` component for dropdown menu
- [ ] 13.4 Ensure components follow existing patterns from tasks and family pages

## 14. Responsive Design
- [ ] 14.1 Implement mobile layout following existing repo patterns (< 768px)
- [ ] 14.2 Implement tablet layout following existing repo patterns (768px - 1023px)
- [ ] 14.3 Implement desktop layout following existing repo patterns (>= 1024px)
- [ ] 14.4 Follow existing responsive patterns from codebase
- [ ] 14.5 Test all breakpoints

## 15. Accessibility
- [ ] 15.1 Ensure proper heading hierarchy
- [ ] 15.2 Add ARIA labels where needed
- [ ] 15.3 Ensure keyboard navigation works

## 16. Final Integration
- [ ] 16.1 Run all tests (unit + E2E)
- [ ] 16.2 Run linter and fix any issues
- [ ] 16.3 Manual testing of complete flow
- [ ] 16.4 Verify translations display correctly in both languages
- [ ] 16.5 Test realtime updates (if applicable)
