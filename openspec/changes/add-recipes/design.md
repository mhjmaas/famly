# Design: Recipes Capability

## Architecture Overview

The recipes capability follows the established Famly modular pattern:

```
modules/recipes/
├── domain/
│   └── recipe.ts               # Entity and DTO interfaces
├── lib/
│   └── recipe.mapper.ts        # Domain → HTTP DTO mapping
├── repositories/
│   └── recipe.repository.ts    # MongoDB data access
├── services/
│   └── recipe.service.ts       # Business logic
├── validators/
│   ├── create-recipe.validator.ts
│   ├── update-recipe.validator.ts
│   ├── list-recipes.validator.ts
│   └── search-recipes.validator.ts
├── middleware/
│   └── index.ts                # Reuse family auth checks
├── routes/
│   ├── create-recipe.route.ts
│   ├── get-recipe.route.ts
│   ├── list-recipes.route.ts
│   ├── update-recipe.route.ts
│   ├── delete-recipe.route.ts
│   ├── search-recipes.route.ts
│   └── recipes.router.ts       # Main router
└── index.ts                    # Module exports
```

## Data Model

**Recipe Document**
```typescript
interface Recipe {
  _id: ObjectId
  familyId: ObjectId
  name: string                  // Required, max 200 chars
  description: string           // Required, max 2000 chars
  steps: string[]               // Required, non-empty array, each step max 500 chars
  tags: string[]                // Optional, max 20 tags, each max 50 chars
  createdBy: ObjectId
  createdAt: Date
  updatedAt: Date
}
```

**Database Collection**: `recipes`
**Indexes**: `familyId`, `createdAt` (for list/search performance)

## API Routes

All endpoints are family-scoped and require authentication + family membership.

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/v1/families/:familyId/recipes` | Create recipe |
| GET | `/v1/families/:familyId/recipes` | List recipes with pagination |
| GET | `/v1/families/:familyId/recipes/:recipeId` | Retrieve single recipe |
| PATCH | `/v1/families/:familyId/recipes/:recipeId` | Update recipe |
| DELETE | `/v1/families/:familyId/recipes/:recipeId` | Delete recipe |
| POST | `/v1/families/:familyId/recipes/search` | Search recipes (name + description) |

## Authorization

- **Authentication**: Required for all endpoints (JWT bearer token)
- **Family membership**: User must be a member of the family (any role)
- **Creator ownership**: No special restrictions; all family members can manage all recipes

## Validation Rules

| Field | Rules |
|-------|-------|
| `name` | Required, 1–200 characters |
| `description` | Required, 1–2000 characters |
| `steps` | Required, 1+ non-empty strings, each 1–500 characters |
| `tags` | Optional, 0–20 tags, each 1–50 characters |

## Search Implementation

- **Text search** on `name` and `description` fields (case-insensitive)
- **Pagination**: Limit and offset support (default limit: 10, max: 100)
- **Sorting**: By `createdAt` descending (newest first)
- **Tag filtering**: Out of scope for MVP; will be added as separate capability

## Similarity to Existing Patterns

This design mirrors the **shopping-lists** capability:
- Modular Express structure
- Zod validators for all inputs
- Embedded tag support (optional string array)
- Family-scoped authorization
- MongoDB repositories with mappers
- Comprehensive e2e and unit test coverage

## Testing Strategy

- **Unit tests**: Validators, mappers, repository queries
- **E2E tests**: Full workflow for each endpoint with real MongoDB (Testcontainers)
- **Authorization tests**: Verify non-members cannot access
- **Edge cases**: Empty tags, max length boundaries, non-existent recipes
