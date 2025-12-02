# Design: Add Web Shopping Lists Page

## Context
The shopping lists API is fully implemented with CRUD operations for lists and items. The web frontend needs a complete UI following existing patterns from TasksView. The reference design in `reference/v0-famly/components/shopping-lists-view.tsx` provides visual guidance but needs to be split into smaller components and enhanced with missing features.

## Goals / Non-Goals

### Goals
- Implement fully functional shopping lists page matching reference design visuals
- Follow existing component patterns (TasksView, TaskCard, etc.)
- Support i18n for en-US and nl-NL
- Achieve 100% unit test coverage for Redux slice
- Provide comprehensive E2E tests with page object pattern

### Non-Goals
- Real-time collaboration (future enhancement)
- Offline support / PWA caching for shopping lists
- Drag-and-drop item reordering
- Item quantity tracking

## Decisions

### Component Structure
**Decision**: Split the monolithic reference component into smaller, focused components.
```
components/shopping-lists/
├── ShoppingListsView.tsx      # Main view with state management
├── ShoppingListCard.tsx       # Individual list card
├── ShoppingListItem.tsx       # Item with checkbox
├── ShoppingListDialog.tsx     # Create/edit dialog
├── DeleteShoppingListDialog.tsx # Delete confirmation
├── AddItemInput.tsx           # Inline item addition
└── EmptyState.tsx             # Empty state display
```
**Rationale**: Follows existing patterns (TasksView, TaskCard), improves testability, enables reuse.

### State Management
**Decision**: Use Redux Toolkit slice pattern matching tasks.slice.ts.
```typescript
interface ShoppingListsState {
  lists: ShoppingList[];
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;
}
```
**Rationale**: Consistent with existing slices, enables optimistic updates, centralizes state.

### API Client Functions
**Decision**: Add functions to api-client.ts following existing patterns.
```typescript
// Shopping Lists API
getShoppingLists(familyId: string, cookie?: string): Promise<ShoppingList[]>
getShoppingList(familyId: string, listId: string, cookie?: string): Promise<ShoppingList>
createShoppingList(familyId: string, data: CreateShoppingListRequest, cookie?: string): Promise<ShoppingList>
updateShoppingList(familyId: string, listId: string, data: UpdateShoppingListRequest, cookie?: string): Promise<ShoppingList>
deleteShoppingList(familyId: string, listId: string, cookie?: string): Promise<void>
addShoppingListItem(familyId: string, listId: string, data: AddItemRequest, cookie?: string): Promise<ShoppingList>
updateShoppingListItem(familyId: string, listId: string, itemId: string, data: UpdateItemRequest, cookie?: string): Promise<ShoppingList>
deleteShoppingListItem(familyId: string, listId: string, itemId: string, cookie?: string): Promise<ShoppingList>
```
**Rationale**: Matches existing API client patterns, supports both client and server-side usage.

### TypeScript Types
**Decision**: Add types to api.types.ts matching API DTOs.
```typescript
interface ShoppingListItem {
  _id: string;
  name: string;
  checked: boolean;
  createdAt: string;
}

interface ShoppingList {
  _id: string;
  familyId: string;
  name: string;
  tags: string[];
  items: ShoppingListItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateShoppingListRequest {
  name: string;
  tags?: string[];
  items?: Array<{ name: string }>;
}

interface UpdateShoppingListRequest {
  name?: string;
  tags?: string[];
}

interface AddItemRequest {
  name: string;
}

interface UpdateItemRequest {
  name?: string;
  checked?: boolean;
}
```
**Rationale**: String IDs at edge (ObjectId terminated at API/repository layer per project convention).

### Dialog Pattern
**Decision**: Use Dialog component (not Drawer) for create/edit forms.
**Rationale**: Matches existing task creation pattern, works well on both desktop and mobile.

### Inline Item Addition
**Decision**: Always show an input field at the bottom of active shopping lists for adding items.
**Rationale**: User requirement - enables quick item addition without opening dialogs.

### Completion Detection
**Decision**: A shopping list is "completed" when all items are checked (derived state, not stored).
**Rationale**: Matches reference design behavior, no API changes needed.

### Date Grouping
**Decision**: Group completed lists by completion date using date-fns utilities.
**Rationale**: Matches reference design, uses existing date-fns dependency.

### data-testid Attributes
**Decision**: Add data-testid attributes to all interactive elements.
```
shopping-lists-page
shopping-lists-header
shopping-lists-title
shopping-lists-description
shopping-lists-create-button
shopping-lists-empty
shopping-lists-empty-create
shopping-lists-list
shopping-list-card
shopping-list-name
shopping-list-tags
shopping-list-item-count
shopping-list-check-all
shopping-list-menu-button
shopping-list-menu
shopping-list-action-edit
shopping-list-action-delete
shopping-list-item
shopping-list-item-checkbox
shopping-list-item-name
shopping-list-add-item-input
shopping-list-add-item-button
shopping-list-dialog
shopping-list-dialog-title
shopping-list-name-input
shopping-list-add-tags-button
shopping-list-tags-input
shopping-list-tag-badge
shopping-list-tag-remove
shopping-list-dialog-cancel
shopping-list-dialog-submit
shopping-list-delete-dialog
shopping-list-delete-cancel
shopping-list-delete-confirm
```
**Rationale**: Enables reliable E2E testing, follows existing patterns.

## Risks / Trade-offs

- **Risk**: Large number of API calls when checking/unchecking items rapidly
  - **Mitigation**: Consider debouncing or batching in future iteration
  
- **Risk**: Optimistic updates may cause UI flicker on error
  - **Mitigation**: Proper error handling with toast notifications

## Migration Plan
No migration needed - this is a new feature replacing a placeholder page.

## Open Questions
None - all requirements are clear from the user request and reference design.
