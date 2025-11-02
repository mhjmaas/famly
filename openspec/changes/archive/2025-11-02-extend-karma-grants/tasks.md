# Tasks: Extend Karma Grants

## Implementation Tasks

### 1. Update Validator Schema
**Acceptance Criteria:**
- `grant-karma.validator.ts` updated to allow -100,000 to 100,000 range
- `grant-karma.validator.test.ts` updated with tests for:
  - Valid negative values: -100,000, -1
  - Valid positive values: 1, 100,000 (existing tests still pass)
  - Invalid values: -100,001, 100,001
  - Boundary edge cases

**Effort:** Small (1 file, 1 schema change, ~10 test lines)

---

### 2. Update Route Documentation
**Acceptance Criteria:**
- `grant-karma.route.ts` JSDoc comment updated to document negative amounts
- Example request body in comment shows negative amount
- Description clarifies this endpoint handles both grants and penalties

**Effort:** Minimal (~5 lines)

---

### 3. Update Spec with Requirement Changes
**Acceptance Criteria:**
- `spec.md` scenarios updated:
  - "Reject negative karma amounts" → "Accept negative karma amounts for penalties"
  - "Reject excessive karma amounts" → reflects 100,000 limit
- New scenario added: "Grant negative karma (penalty) successfully"
- All existing scenarios for positive grants unchanged
- `openspec validate karma` passes

**Effort:** Small (~20 lines)

---

### 4. Add E2E Tests for Negative Grants
**Acceptance Criteria:**
- New test file or section in `grant-karma.e2e.test.ts`:
  - Parent grants -50 karma successfully → total decrements
  - Parent grants negative amount to child → appears in history with negative value
  - Parent grants -100,000 (boundary) → succeeds
  - Parent grants -100,001 (out of range) → HTTP 400
- All new tests pass
- All existing tests still pass (regression)

**Effort:** Small (~50 lines)

---

### 5. Run Full Test Suite
**Acceptance Criteria:**
- `pnpm test` passes (unit + e2e)
- No karma-related test failures
- No regressions in other modules

**Effort:** Validation only

---

### 6. Validate Specs
**Acceptance Criteria:**
- `openspec validate --specs` passes
- No spec conflicts or issues

**Effort:** Validation only

---

## Summary

| Task | Files | Effort | Dependencies |
|------|-------|--------|--------------|
| 1. Update validator | 2 | Small | None |
| 2. Update route docs | 1 | Minimal | None |
| 3. Update spec | 1 | Small | None |
| 4. Add e2e tests | 1 | Small | Task 1 |
| 5. Test suite | - | Validation | Tasks 1-4 |
| 6. Validate specs | - | Validation | Task 3 |

**Total Effort:** ~2 hours (straightforward validator and test updates)

**Critical Path:** Tasks 1 → 2 → 3 → 4 → 5/6 (sequential)

**Parallelizable:** Tasks 2 and 3 can run in parallel with task 1 once validator is complete
