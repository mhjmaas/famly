# Tasks: Update Member Role

## Implementation Order
Tasks are ordered to follow TDD principles and ensure incremental, testable progress.

## Task List

- [x] Task 1: Add domain types
- [x] Task 2: Write failing e2e tests
- [x] Task 3: Create Zod validator
- [x] Task 4: Add repository method
- [x] Task 5: Add service method
- [x] Task 6: Create route handler
- [x] Task 7: Register route in family router
- [x] Task 8: Run full test suite and verify green
- [x] Task 9: Add Bruno API collection request (optional)

---

### 1. Add domain types for update member role
**File**: `apps/api/src/modules/family/domain/family.ts`

**Actions**:
- Add `UpdateMemberRoleRequest` interface with `role: FamilyRole` field
- Add `UpdateMemberRoleResponse` interface with `memberId`, `familyId`, `role`, and `updatedAt` fields
- Export both interfaces

**Verification**:
- Types compile without errors
- Types are exported and can be imported

**Dependencies**: None

---

### 2. Write failing e2e tests for update member role
**File**: `apps/api/tests/e2e/family/update-member-role.e2e.test.ts`

**Actions**:
- Create test file following existing family e2e test patterns
- Write test cases covering all 7 scenarios from spec:
  1. Successful Child → Parent update
  2. Successful Parent → Child update
  3. Authorization failure (non-parent)
  4. Invalid role value
  5. Invalid family ID
  6. Invalid member ID
  7. Member from different family
- Use `getTestApp()`, `cleanDatabase()`, and `request()` helpers
- Assert response status codes, body structure, and error messages
- All tests should fail (route not implemented yet)

**Verification**:
- Run `pnpm test:e2e:api -- update-member-role.e2e.test.ts`
- All tests fail with expected errors (route not found)

**Dependencies**: Task 1 (domain types)

---

### 3. Create Zod validator for update member role
**File**: `apps/api/src/modules/family/validators/update-member-role.validator.ts`

**Actions**:
- Create `updateMemberRoleSchema` using Zod
- Validate `role` field is a valid `FamilyRole` enum value
- Export `UpdateMemberRolePayload` type
- Create `validateUpdateMemberRole` Express middleware
- Follow existing validator patterns (see `add-family-member.validator.ts`)
- Throw `HttpError.badRequest()` for validation failures

**Verification**:
- File compiles without errors
- Validator exports can be imported
- Re-run e2e tests (still failing, but progressing)

**Dependencies**: Task 1 (domain types)

---

### 4. Add repository method for updating member role
**File**: `apps/api/src/modules/family/repositories/family-membership.repository.ts`

**Actions**:
- Add `updateMemberRole(familyId: ObjectId, userId: ObjectId, role: FamilyRole): Promise<boolean>` method
- Use MongoDB `updateOne` with `$set: { role, updatedAt: new Date() }`
- Return `true` if `modifiedCount > 0`, else `false`
- Add JSDoc comment explaining method purpose

**Verification**:
- Method compiles without errors
- Repository can be instantiated with new method
- Re-run e2e tests (still failing, but progressing)

**Dependencies**: Task 1 (domain types)

---

### 5. Add service method for updating member role
**File**: `apps/api/src/modules/family/services/family.service.ts`

**Actions**:
- Add `updateMemberRole(familyId: ObjectId, memberId: ObjectId, role: FamilyRole): Promise<UpdateMemberRoleResponse>` method
- Validate family exists using `familyRepository.findById()`
- Throw `HttpError.notFound("Family not found")` if missing
- Validate membership exists using `membershipRepository.findByFamilyAndUser()`
- Throw `HttpError.notFound("Member not found")` if missing
- Call `membershipRepository.updateMemberRole()`
- Fetch updated membership to get `updatedAt`
- Return formatted `UpdateMemberRoleResponse`
- Add JSDoc comment

**Verification**:
- Service method compiles without errors
- Re-run e2e tests (some may start passing)

**Dependencies**: Tasks 3 (validator) and 4 (repository)

---

### 6. Create route handler for update member role
**File**: `apps/api/src/modules/family/routes/update-member-role.route.ts`

**Actions**:
- Create `createUpdateMemberRoleRoute()` function returning Express Router
- Register `PATCH /:familyId/members/:memberId` route
- Apply middleware chain: `authenticate`, `authorizeFamilyRole({ allowedRoles: [FamilyRole.Parent] })`, `validateUpdateMemberRole`
- Parse `familyId` and `memberId` from route params (convert to ObjectId)
- Call `familyService.updateMemberRole()`
- Return HTTP 200 with service response
- Handle errors with `next(error)`
- Add JSDoc comment documenting route contract

**Verification**:
- Route handler compiles without errors
- Re-run e2e tests (more tests should pass)

**Dependencies**: Tasks 3 (validator) and 5 (service)

---

### 7. Register route in family router
**File**: `apps/api/src/modules/family/routes/index.ts`

**Actions**:
- Import `createUpdateMemberRoleRoute` from `./update-member-role.route`
- Register route with family router: `router.use(createUpdateMemberRoleRoute())`
- Ensure route is registered before catch-all routes (if any)

**Verification**:
- Application compiles without errors
- Re-run e2e tests (all tests should now pass)

**Dependencies**: Task 6 (route handler)

---

### 8. Run full test suite and verify green
**Commands**:
```bash
pnpm test:unit:api
pnpm test:e2e:api -- update-member-role.e2e.test.ts
pnpm test:e2e:api
```

**Actions**:
- Run all unit tests (ensure no regressions)
- Run new e2e test file (ensure all 7 scenarios pass)
- Run full e2e suite (ensure no regressions in other features)
- Fix any failures

**Verification**:
- All tests pass (green)
- No test regressions
- Test coverage includes all scenarios from spec

**Dependencies**: Task 7 (route registration)

---

### 9. Add Bruno API collection request (optional)
**File**: `bruno/Famly/family/update-member-role.bru`

**Actions**:
- Create Bruno request file following existing family folder patterns
- Configure `PATCH {{baseUrl}}/families/{{familyId}}/members/{{memberId}}`
- Add bearer token from environment
- Add example request body
- Add example response

**Verification**:
- Bruno request can be imported
- Manual API testing works

**Dependencies**: Task 7 (route registration)

**Parallelizable**: Can be done alongside Task 8

---

## Summary
- **Total Tasks**: 9
- **Sequential Dependencies**: Tasks 1-7 must be completed in order (TDD flow)
- **Parallelizable**: Task 9 can be done alongside Task 8
- **Estimated Time**: 4-6 hours total
- **Key Milestones**:
  - Task 2: Tests written (red)
  - Task 7: Implementation complete (green)
  - Task 8: Full suite passing (verification)
