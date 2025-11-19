# Implementation Tasks

## 1. Update Member Overview Cards
- [x] 1.1 Remove dropdown menu from `FamilyMemberCard` component
- [x] 1.2 Add clickable card wrapper or "View Details" link to navigate to member detail page
- [x] 1.3 Update card styling to indicate it's clickable (hover states, cursor pointer)
- [x] 1.4 Add data-testid attributes for E2E testing

## 2. Remove Dialogs from Family View
- [x] 2.1 Remove `EditRoleDialog`, `RemoveMemberDialog`, and `GiveKarmaDialog` imports and usage from `FamilyView`
- [x] 2.2 Remove dialog state management (useState hooks for dialog open/close)
- [x] 2.3 Remove dialog handler functions (handleEditRole, handleRemove, handleGiveKarma)
- [x] 2.4 Keep `AddMemberDialog` as it's still needed for adding new members
- [x] 2.5 Delete `give-karma-dialog.tsx` file (replaced by MemberKarmaCard)

## 3. Create Member Detail Page Route
- [x] 3.1 Create `/apps/web/src/app/[lang]/app/family/[memberId]/page.tsx`
- [x] 3.2 Implement server component with proper params handling
- [x] 3.3 Fetch dictionary for i18n support
- [x] 3.4 Pass member data and translations to detail view component

## 4. Create Member Detail View Component
- [x] 4.1 Create `MemberDetailView` component in `/apps/web/src/components/family/`
- [x] 4.2 Implement header section with member name (title) and age (description)
- [x] 4.3 Add avatar and karma display in top-right corner
- [x] 4.4 Implement breadcrumb navigation (Family Members > [Member Name])
- [x] 4.5 Add back button for mobile navigation
- [x] 4.6 Add dropdown menu (three dots) for edit/delete actions (parent users only)
- [x] 4.7 Position dropdown menu at same level as tabs, aligned to the right
- [x] 4.8 Integrate existing `EditRoleDialog` and `RemoveMemberDialog` components (reused from family view)
- [x] 4.9 Add data-testid attributes throughout for E2E testing

## 5. Create Tabs Navigation
- [x] 5.1 Implement shadcn Tabs component with single "Give Karma" tab
- [x] 5.2 Create flex container with tabs (center-aligned) and actions menu (right-aligned)
- [x] 5.3 Ensure actions dropdown menu is at same level as tabs, not inside tab content
- [x] 5.4 Ensure tab content area is properly styled

## 6. Create Simplified Karma Card
- [x] 6.1 Create `MemberKarmaCard` component
- [x] 6.2 Implement karma amount input (accepts positive or negative numbers directly)
- [x] 6.3 Add description textarea with required validation
- [x] 6.4 Add "Give Karma" button with Sparkles icon
- [x] 6.5 Integrate with Redux `grantMemberKarma` thunk
- [x] 6.6 Handle loading states during karma grant
- [x] 6.7 Display success/error messages via toast
- [x] 6.8 Add helper text explaining positive/negative input
- [x] 6.9 Add data-testid attributes for testing

## 7. Integrate Activity Timeline
- [x] 7.1 Reuse `ActivityTimeline` component from profile page
- [x] 7.2 Filter activity events by member ID
- [x] 7.3 Fetch member-specific activity events from API
- [x] 7.4 Display timeline below karma card following reference design
- [x] 7.5 Ensure proper spacing and layout consistency

## 8. Update Redux Store
- [x] 8.1 Add selector `selectFamilyMemberById(memberId)` to family slice
- [x] 8.2 Ensure `grantMemberKarma` thunk properly updates karma in both family and karma slices
- [x] 8.3 Verify all existing thunks work correctly with new page structure

## 9. Add Translations
- [x] 9.1 Add member detail page translations to `en-US.json`
- [x] 9.2 Add member detail page translations to `nl-NL.json`
- [x] 9.3 Include translations for:
  - Page breadcrumbs
  - Tab labels
  - Karma card labels and placeholders
  - Activity timeline section
  - Edit/delete menu items
  - Success/error messages
  - Validation messages

## 10. Create E2E Tests
- [x] 10.1 Create `family-member-detail.page.ts` page object with locators and helpers
- [x] 10.2 Create `family-member-detail.spec.ts` test file
- [x] 10.3 Test navigation from family overview to detail page
- [x] 10.4 Test member information display (name, age, avatar, karma)
- [x] 10.5 Test breadcrumb navigation
- [x] 10.6 Test tab switching (when multiple tabs exist)
- [x] 10.7 Test karma grant with positive amount
- [x] 10.8 Test karma deduction with negative amount
- [x] 10.9 Test karma validation (empty description, zero amount)
- [x] 10.10 Test edit role dialog from detail page
- [x] 10.11 Test remove member dialog from detail page
- [x] 10.12 Test activity timeline displays member events
- [x] 10.13 Test responsive behavior (mobile, tablet, desktop)
- [x] 10.14 Test parent vs child user permissions

## 11. Add Unit Tests for Redux
- [x] 11.1 Add tests for `selectFamilyMemberById` selector
- [x] 11.2 Ensure 100% coverage of new Redux code
- [x] 11.3 Test karma grant updates both family and karma slices
- [x] 11.4 Test error handling in karma operations

## 12. Update Existing Tests
- [x] 12.1 Update `family.spec.ts` E2E tests to reflect removed dialogs from overview
- [x] 12.2 Update `family.page.ts` page object to remove dialog-related locators
- [x] 12.3 Ensure all existing family tests still pass

## 13. Component Decomposition
- [x] 13.1 Break down large components into smaller logical pieces
- [x] 13.2 Create `MemberDetailHeader` component for header section
- [x] 13.3 Create `MemberDetailActions` component for dropdown menu
- [x] 13.4 Ensure components follow existing patterns from tasks and family pages

## 14. Responsive Design
- [x] 14.1 Implement mobile layout following existing repo patterns (< 768px)
- [x] 14.2 Implement tablet layout following existing repo patterns (768px - 1023px)
- [x] 14.3 Implement desktop layout following existing repo patterns (>= 1024px)
- [x] 14.4 Follow existing responsive patterns from codebase
- [x] 14.5 Test all breakpoints

## 15. Accessibility
- [x] 15.1 Ensure proper heading hierarchy
- [x] 15.2 Add ARIA labels where needed
- [x] 15.3 Ensure keyboard navigation works

## 16. Final Integration
- [x] 16.1 Run all tests (unit + E2E)
- [x] 16.2 Run linter and fix any issues (remaining issues are in shadcn breadcrumb component)
- [x] 16.3 Implement parent-only karma restrictions (children cannot see karma tab/card)
- [x] 16.4 Fix E2E tests to use testIds and reflect new page structure
- [x] 16.5 Manual testing of complete flow
- [x] 16.6 Verify translations display correctly in both languages
- [x] 16.7 Test realtime updates (karma refresh implemented)
