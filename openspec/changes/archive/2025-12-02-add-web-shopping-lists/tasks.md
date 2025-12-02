# Tasks: Add Web Shopping Lists Page

## 1. Types and API Client
- [x] 1.1 Add shopping list TypeScript types to `api.types.ts`
- [x] 1.2 Add shopping list API client functions to `api-client.ts`

## 2. Redux Store
- [x] 2.1 Create `shopping-lists.slice.ts` with state, thunks, and selectors
- [x] 2.2 Register shopping lists reducer in `store.ts`
- [x] 2.3 Write unit tests for shopping lists slice (100% coverage)

## 3. Translations
- [x] 3.1 Update `en-US/dashboard/shopping-lists.json` with all translations
- [x] 3.2 Update `nl-NL/dashboard/shopping-lists.json` with all translations

## 4. Components
- [x] 4.1 Create `ShoppingListsView.tsx` main view component
- [x] 4.2 Create `ShoppingListCard.tsx` for individual list display
- [x] 4.3 Create `ShoppingListItem.tsx` for item with checkbox
- [x] 4.4 Create `ShoppingListDialog.tsx` for create/edit dialog (with Drawer on mobile)
- [x] 4.5 Create `DeleteShoppingListDialog.tsx` for delete confirmation (with Drawer on mobile)
- [x] 4.6 Create `AddItemInput.tsx` for inline item addition
- [x] 4.7 Create `EmptyState.tsx` for empty shopping lists state

## 5. Page Integration
- [x] 5.1 Update shopping lists page to use `ShoppingListsView` component
- [x] 5.2 Add server-side data fetching for family context

## 6. E2E Tests
- [x] 6.1 Create `shopping-lists.page.ts` page object with locators and helpers
- [x] 6.2 Create `shopping-lists.spec.ts` E2E test file with comprehensive tests
