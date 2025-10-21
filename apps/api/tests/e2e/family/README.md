# Family Module E2E Tests

This directory contains end-to-end tests for the family management API endpoints.

## Coverage Focus

- **POST /v1/families**: Family creation with authentication, payload validation, and persistence verification
- **GET /v1/families**: Family listing with proper role and membership data
- **Auth Integration**: Verify JWT enrichment and /v1/auth/me includes family data
- **Error Cases**: Invalid payloads, unauthorized access, role violations

## Running Tests

```bash
npm run test:e2e -- family
```

These tests use Testcontainers to spin up a MongoDB instance automatically.
