# Shopping Lists Design

## Context

Families need a shared shopping list feature to coordinate household purchases. This feature should allow family members to create multiple lists (e.g., "Weekly Groceries", "Hardware Store"), add items to lists, and mark items as purchased. Following the established tasks module patterns ensures consistency and maintainability.

## Goals / Non-Goals

**Goals:**
- Enable families to create and manage multiple shopping lists
- Allow all family members to view, create, update, and delete shopping lists
- Support checking off items as they are purchased
- Provide flexible categorization via tags (e.g., "groceries", "urgent")
- Follow the same architectural patterns as the tasks module for consistency

**Non-Goals:**
- Real-time synchronization (future enhancement)
- Item price tracking or budgeting (out of scope for MVP)
- Barcode scanning or product databases (future enhancement)
- Role-based permissions (all family members have equal access)
- Recurring shopping lists or templates (keep simple for MVP)

## Decisions

### Data Model

**ShoppingList Entity:**
```typescript
interface ShoppingList {
  _id: ObjectId;
  familyId: ObjectId;
  name: string; // Max 200 chars, e.g., "Weekly Groceries"
  tags: string[]; // Optional categorization, max 20 tags, each max 50 chars
  items: ShoppingListItem[];
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface ShoppingListItem {
  _id: ObjectId; // Unique identifier for the item
  name: string; // Max 200 chars, e.g., "Milk"
  checked: boolean; // Whether item has been purchased
  createdAt: Date;
}
```

**Rationale:**
- Embed items within shopping list document (similar to how tasks are standalone but related to schedules)
- Items are simpler than tasks: just name + checked status + created timestamp
- Tags stored as string array for flexible categorization without rigid schema
- Each item has its own _id for granular updates (check/uncheck, delete specific item)

### Architecture Pattern

Following tasks module structure:
```
modules/shopping-lists/
├── domain/
│   └── shopping-list.ts          # Types and interfaces
├── repositories/
│   └── shopping-list.repository.ts  # MongoDB CRUD operations
├── services/
│   └── shopping-list.service.ts  # Business logic + authorization
├── routes/
│   ├── shopping-lists.router.ts  # Main router
│   ├── create-list.route.ts      # POST /
│   ├── list-lists.route.ts       # GET /
│   ├── get-list.route.ts         # GET /:listId
│   ├── update-list.route.ts      # PATCH /:listId
│   ├── delete-list.route.ts      # DELETE /:listId
│   ├── add-item.route.ts         # POST /:listId/items
│   └── update-item.route.ts      # PATCH /:listId/items/:itemId
├── validators/
│   ├── create-list.validator.ts
│   ├── update-list.validator.ts
│   ├── add-item.validator.ts
│   └── update-item.validator.ts
├── lib/
│   └── shopping-list.mapper.ts   # Entity to DTO conversion
└── index.ts                      # Module exports
```

### REST API Design

Base path: `/v1/families/{familyId}/shopping-lists`

**Endpoints:**
- `POST /` - Create shopping list (name, tags, optional initial items)
- `GET /` - List all shopping lists for family
- `GET /:listId` - Get specific shopping list
- `PATCH /:listId` - Update list name/tags
- `DELETE /:listId` - Delete shopping list
- `POST /:listId/items` - Add item to list
- `PATCH /:listId/items/:itemId` - Update item (name, checked status)
- `DELETE /:listId/items/:itemId` - Remove item from list

**Alternatives Considered:**
1. Separate items collection - Rejected: Adds complexity, shopping list items don't need independent lifecycle
2. Single update endpoint for all operations - Rejected: Less RESTful, harder to validate and test
3. Bulk item operations - Deferred: Can add later if needed, start simple

### Authorization

- All endpoints require authentication (JWT)
- All endpoints require family membership (same as tasks module)
- No role-based restrictions: parents and children have equal access
- Use existing `authenticate` and family membership check pattern from tasks

### MongoDB Indexes

```typescript
// Primary query: list shopping lists by family
{ familyId: 1, createdAt: -1 }

// Query by family and tags for filtering
{ familyId: 1, tags: 1 }
```

### Field Validation

Using Zod validators:
- List name: required, 1-200 chars
- Tags: optional array, max 20 tags, each 1-50 chars
- Item name: required, 1-200 chars
- Item checked: boolean, defaults to false

## Risks / Trade-offs

**Risk:** Embedding items could hit MongoDB document size limit (16MB)
- **Mitigation:** Reasonable for shopping lists; typical list has <100 items. Monitor in production.
- **Rollback:** If needed, can migrate to separate collection without API changes (implementation detail)

**Risk:** Concurrent updates to items (multiple family members editing simultaneously)
- **Mitigation:** MongoDB's atomic update operations handle concurrency. Use `$push`, `$pull`, `$set` for item operations.
- **Future:** Can add optimistic locking with version field if needed

**Trade-off:** No item-level history or audit trail
- **Acceptance:** Shopping lists are transient; history less critical than for tasks/chores
- **Future:** Can add item history if requested

## Migration Plan

**Phase 1: Implementation**
1. Create module structure and domain types
2. Implement repository with MongoDB operations
3. Build service layer with authorization
4. Add route handlers and validators
5. Write unit tests (validators, mappers)
6. Write e2e tests (full CRUD workflows)

**Phase 2: Integration**
1. Register shopping-lists router in main app
2. Call `ensureIndexes()` during app startup
3. Run full test suite
4. Verify with manual API testing using Bruno

**Rollback:**
- No database migrations required (new collections)
- Can remove module without affecting existing functionality
- No breaking changes to existing APIs

## Open Questions

None - design is ready for implementation.
