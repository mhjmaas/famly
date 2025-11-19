# Change: Redesign Member Detail Page

## Why
The current family members page combines viewing and editing functionality in a single card with a dropdown menu. This creates a cluttered UX and doesn't provide enough space to display detailed member information, karma management, and activity history. Moving to a dedicated detail page improves information architecture and allows for richer member-specific features.

## What Changes
- Remove edit/grant karma/delete actions from member overview cards (dropdown menu removed)
- Add clickable link/navigation to member detail page from overview cards
- Create new member detail page at `/app/family/[memberId]` with:
  - Member name and age as title/description
  - Karma amount and avatar in top-right corner
  - Actions dropdown menu (three dots) aligned to right, same level as tabs, containing "Edit Member" and "Remove Member" (reuses existing dialogs)
  - Tab navigation with "Give Karma" tab (single tab initially)
  - Simplified karma grant/deduct card with direct positive/negative input (no radio button selection)
  - Activity timeline showing member's recent activity (reusing profile page component)
- Update Redux family slice to support member-specific operations
- Add comprehensive E2E tests with page object pattern
- Add 100% unit test coverage for Redux changes
- Full i18n support for all new UI text

## Impact
- Affected specs: `web-family`
- Affected code:
  - `apps/web/src/components/family/family-member-card.tsx` - Remove dropdown menu, add navigation link
  - `apps/web/src/components/family/family-view.tsx` - Remove all dialog handlers, move dialogs to detail page
  - `apps/web/src/components/family/give-karma-dialog.tsx` - **DELETED** (replaced by MemberKarmaCard)
  - `apps/web/src/app/[lang]/app/family/[memberId]/page.tsx` - New detail page
  - `apps/web/src/components/family/member-detail-view.tsx` - New component (includes edit/remove dialogs)
  - `apps/web/src/components/family/member-karma-card.tsx` - New simplified karma card
  - `apps/web/src/store/slices/family.slice.ts` - Potential selector additions
  - `apps/web/src/dictionaries/en-US.json` and `nl-NL.json` - New translations
  - `apps/web/tests/e2e/app/family-member-detail.spec.ts` - New E2E tests
  - `apps/web/tests/e2e/pages/family-member-detail.page.ts` - New page object
