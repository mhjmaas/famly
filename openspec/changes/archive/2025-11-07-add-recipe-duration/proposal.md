# Change: Add Recipe Duration Field

## Why
Families want to know roughly how long a recipe takes before starting it. Today our API does not store or expose any duration metadata, which makes it harder to plan meals or filter for "quick" dishes. Adding an optional duration in minutes keeps backward compatibility while unlocking better UX later.

## What Changes
- Extend recipe payloads (create, update, responses, listings, search) with optional `durationMinutes`.
- Validate that when provided, the value is a positive integer representing minutes and capped to a reasonable daily maximum.
- Store the field in MongoDB and include it in all DTOs/domain models.
- Cover validator/unit/e2e tests for the new field and ensure existing behavior stays intact.

## Impact
- **Affected specs**: `recipes`
- **Affected code**: Recipe validators, domain models, repository mappers, routes, and API tests.
- **No new external dependencies**.
