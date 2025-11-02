# Design: Extend Karma Grants

## Architectural Decisions

### 1. Single Validator Change vs. Separate Deduction Endpoint
**Decision:** Modify existing `grant-karma` validator to accept negative amounts rather than creating a separate deduction endpoint.

**Rationale:**
- Simpler API surface (single endpoint for all manual karma adjustments)
- Parents already have the `deductKarma` method for reward redemptions; allowing manual negative grants via the same grant endpoint reduces cognitive load
- Consistent authorization (parent role check applies to all adjustments)
- Avoids duplication of validation logic

### 2. Range: -100,000 to 100,000
**Decision:** Allow symmetrical range around zero: -100,000 to 100,000

**Rationale:**
- User requested max of 100,000 to accommodate larger reward structures
- Symmetrical design is intuitive (same limits for positive and negative)
- Prevents accidental extreme values (1,000,000+) that could break sorting or display logic
- Conservative enough for household governance use cases

### 3. Allow Negative Totals
**Decision:** Do not clamp or block karma totals that go negative.

**Rationale:**
- Parents may want to "debt" a member (penalty-based system)
- Flexibility for creative household governance (e.g., "you owe us 50 karma")
- Aligns with `deductKarma` behavior (no minimum balance check for manual grants, only for reward redemptions)
- System already stores and retrieves negative amounts correctly via `KarmaService.awardKarma(-X)`

## Implementation Details

### Changes Required

#### 1. `grant-karma.validator.ts`
```typescript
// Current:
amount: z
  .number()
  .int("Amount must be an integer")
  .min(1, "Amount must be at least 1")
  .max(1000, "Amount cannot exceed 1000"),

// Updated:
amount: z
  .number()
  .int("Amount must be an integer")
  .min(-100000, "Amount cannot be less than -100000")
  .max(100000, "Amount cannot exceed 100000"),
```

#### 2. `grant-karma.route.ts`
- Update JSDoc comment to indicate negative amounts are allowed
- Update description to clarify this endpoint handles both grants and deductions

#### 3. `karma/spec.md`
- Update "Reject negative karma amounts" scenario to "Accept negative karma amounts for penalties"
- Update max amount from 1000 to 100,000
- Add scenario for negative grant execution
- Update "Reject excessive karma amounts" to reflect new limit

#### 4. Tests
- `grant-karma.validator.test.ts`: Add tests for negative values
- `grant-karma.e2e.test.ts`: Add e2e tests for negative grants

## Backward Compatibility

All existing code paths remain unchanged:
- `KarmaService.grantKarma()` already handles any integer via `awardKarma()`
- `KarmaService.awardKarma()` adds the amount (positive or negative) to the member's total
- `karmaRepository.upsertMemberKarma()` uses `$inc` operator, which works with negative values

No data migrations needed. Existing records and totals are unaffected.

## Testing Approach

### Unit Tests
- Validator accepts: -100,000, -1, 1, 100,000
- Validator rejects: -100,001, 100,001, 0 (already tested), 10.5 (already tested)
- Negative amounts preserve description and metadata

### E2E Tests
- Parent grants -50 karma to child → total decrements by 50
- Parent grants 100 karma then -50 → net +50
- Verify negative totals appear in history with negative amounts
- Verify negative grants appear in history with `source: 'manual_grant'`

### Regression Tests
- All existing positive grant tests pass unchanged
- Existing reward deduction flows unaffected
- Task-based karma awards unaffected
