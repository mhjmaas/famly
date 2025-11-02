# Proposal: Extend Karma Grants to Support Negative Values and Higher Limits

**Change ID:** `extend-karma-grants`

**Status:** Proposed

**Date:** 2025-11-02

## Why

Currently, the karma grant system only allows positive karma amounts (1-1000). This prevents parents from:
1. **Deducting karma as penalties or corrections** - Parents need a way to penalize negative behavior or correct mistakes using the same grant endpoint
2. **Granting larger karma rewards** - The 1,000 limit is too restrictive for families who want to support larger achievements or long-term accumulated karma systems

The existing constraints are too rigid for diverse household governance needs.

## What Changes

### Overview
Extend the karma grant system to:
1. **Allow negative karma amounts** via the `grant-karma` endpoint (range: -100,000 to 100,000), enabling parents to deduct karma as penalties or corrections
2. **Increase maximum karma limit** from 1,000 to 100,000 for both positive and negative grants

This maintains backward compatibility (positive grants work exactly as before) while expanding parental flexibility and supporting larger reward structures.

### Scope

**In Scope:**
- Modify `grant-karma` validator to accept negative amounts (range: -100,000 to 100,000)
- Update validator schema validation to support the new range
- Modify route documentation and comments
- Add unit and e2e tests for negative grants and edge cases

**Out of Scope:**
- Changes to the reward redemption system (already deducts karma via `deductKarma`)
- Changes to automatic task-based karma awards
- Changes to data storage or collection structure
- UI changes or display handling (API enforces limits)

### Backwards Compatibility
✓ **Fully compatible** - Existing positive karma grants continue to work unchanged. This is purely additive functionality.

## Implementation Notes

- Negative karma totals are allowed by design; parents have full discretion
- The API enforces hard limits; UI can handle negative balances in future iterations
- No changes needed to `KarmaService.grantKarma()` or `KarmaService.awardKarma()` - they already handle positive and negative amounts
- Only the validator and documentation need updates

## Testing Strategy

- Update existing validator unit tests to verify negative amounts are accepted
- Add new test cases for boundary values (-100,000, 100,000, -1, 0, 1)
- Add e2e tests for both positive and negative grant scenarios
- Verify existing positive grant tests still pass (regression)

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Negative total karma might be unexpected | Allowed by design; parents have full discretion. Document clearly in API comments. |
| Unbounded karma totals could cause display issues in UI | UI will handle negatives in next iteration; API enforces ±100,000 limits. |
| Regression in positive karma flows | Comprehensive test coverage ensures backward compatibility. |

## Success Criteria

- ✓ Validator accepts negative amounts from -100,000 to 100,000
- ✓ Validator rejects amounts outside range
- ✓ All existing tests pass (positive grants unchanged)
- ✓ New tests cover negative grants and edge cases
- ✓ Documentation updated with examples of negative grants
