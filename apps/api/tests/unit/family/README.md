# Family Module Unit Tests

This directory contains unit tests for the family management module.

## Coverage Focus

- **Domain Models**: Validate family and membership type definitions
- **Services**: Test FamilyService methods (createFamily, listFamiliesForUser) in isolation with mocked repositories
- **Validators**: Verify Zod schema validation for create-family payload
- **Mappers**: Test DTO transformations from MongoDB documents to API responses
- **Repositories**: Test repository methods with mocked MongoDB collections

## Running Tests

```bash
npm run test:unit -- family
```
