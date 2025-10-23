# Tasks

## Implementation Tasks

1. **Create `requireCreatorOwnership` utility function** ✅
   - Create `apps/api/src/modules/auth/lib/require-creator-ownership.ts`
   - Implement interface for options (userId, createdBy OR resourceId + lookup function)
   - Implement direct ownership check (compare userId with createdBy ObjectId)
   - Implement repository-based lookup path
   - Throw descriptive HttpError.forbidden when unauthorized
   - Throw HttpError.notFound when resource not found
   - Add comprehensive JSDoc documentation with usage examples
   - Export types and function from the file

2. **Create unit tests for `requireCreatorOwnership`** ✅
   - Create `apps/api/tests/unit/auth/require-creator-ownership.test.ts`
   - Test direct ownership check: authorized (matching IDs)
   - Test direct ownership check: forbidden (non-matching IDs)
   - Test repository lookup: authorized (resource exists, IDs match)
   - Test repository lookup: forbidden (resource exists, IDs don't match)
   - Test repository lookup: not found (resource doesn't exist)
   - Test edge cases: invalid parameters, missing required options
   - Ensure all tests follow existing patterns from `require-family-role.test.ts`

3. **Create `authorizeCreatorOwnership` middleware** ✅
   - Create `apps/api/src/modules/auth/middleware/authorize-creator-ownership.ts`
   - Implement middleware factory accepting options (resourceIdParam, lookupFn)
   - Extract and validate authenticated user from request
   - Extract and validate resource ID from route parameters
   - Call utility function with repository lookup
   - Handle errors and call next() appropriately
   - Add comprehensive JSDoc with usage examples
   - Export middleware factory and options interface

4. **Update auth module exports** ✅
   - Add exports for `requireCreatorOwnership` and types to `apps/api/src/modules/auth/lib/require-creator-ownership.ts`
   - Add exports for `authorizeCreatorOwnership` and types to `apps/api/src/modules/auth/middleware/index.ts`
   - Ensure new utilities are accessible via module imports

5. **Validation and cleanup** ✅
   - Run unit tests: `pnpm -C apps/api run test:unit -- require-creator-ownership`
   - Run linter: `pnpm run lint`
   - Verify TypeScript compilation: `pnpm -C apps/api run build` (if build script exists)
   - Verify no breaking changes to existing code
   - Review code for consistency with existing auth patterns

## Testing Strategy
- **Unit tests**: Comprehensive coverage for `requireCreatorOwnership` utility (similar to `require-family-role.test.ts`)
- **No e2e tests yet**: Since this is infrastructure code not yet integrated into any routes
- **Future integration tests**: When this is used in the diary feature, add e2e tests for the complete flow

## Dependencies
- None - can be implemented immediately
- No changes to existing code required
- No database schema changes needed

## Verification Checklist
- [x] Utility function created with proper TypeScript types
- [x] Unit tests written and passing
- [x] Middleware factory created with proper error handling
- [x] All exports properly configured
- [x] Linter passes
- [x] Code follows existing auth patterns (mirrors family role approach)
- [x] JSDoc documentation complete with examples
